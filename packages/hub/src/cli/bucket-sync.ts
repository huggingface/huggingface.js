import { mkdir, readFile, rmdir, stat, unlink, writeFile } from "node:fs/promises";
import { basename, dirname, join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { HubApiError } from "../error";
import { deleteFiles } from "../lib/delete-files";
import { downloadFile } from "../lib/download-file";
import { uploadFiles } from "../lib/upload-files";
import { isHfUri, parseHfUri, type HfUri } from "../utils/parseHfUri";
import { promisesQueue } from "../utils/promisesQueue";
import { validateRelativeFilename } from "../utils/validateRelativeFilename";
import {
	FilterMatcher,
	joinRemote,
	listRemote,
	parseFilterFile,
	repoOf,
	statLocal,
	walkLocal,
	type CommonOptions,
} from "./bucket-utils";
import { streamBlobToFile } from "./fs";

const SYNC_TIME_WINDOW_MS = 1000;
const BATCH_SIZE = 1000;
const DOWNLOAD_CONCURRENCY = 4;

type SyncAction = "upload" | "download" | "delete" | "skip";

/** Mirrors huggingface_hub's `SyncOperation`. The plan file format is shared with `hf buckets sync`. */
export interface SyncOperation {
	action: SyncAction;
	path: string;
	size?: number;
	reason: string;
	localMtime?: string;
	remoteMtime?: string;
}

export interface SyncPlan {
	source: string;
	dest: string;
	timestamp: string;
	operations: SyncOperation[];
}

interface FileInfo {
	size: number;
	mtime: number;
}

const mtimeToIso = (mtimeMs: number) => new Date(mtimeMs).toISOString().replace("Z", "+00:00");

function summarize(plan: SyncPlan) {
	const count = (action: SyncAction) => plan.operations.filter((op) => op.action === action).length;
	return {
		uploads: count("upload"),
		downloads: count("download"),
		deletes: count("delete"),
		skips: count("skip"),
		total_size: plan.operations
			.filter((op) => op.action === "upload" || op.action === "download")
			.reduce((total, op) => total + (op.size ?? 0), 0),
	};
}

function serializePlan(plan: SyncPlan): string {
	const lines = [
		JSON.stringify({
			type: "header",
			source: plan.source,
			dest: plan.dest,
			timestamp: plan.timestamp,
			summary: summarize(plan),
		}),
		...plan.operations.map((op) =>
			JSON.stringify({
				type: "operation",
				action: op.action,
				path: op.path,
				reason: op.reason,
				...(op.size !== undefined && { size: op.size }),
				...(op.localMtime !== undefined && { local_mtime: op.localMtime }),
				...(op.remoteMtime !== undefined && { remote_mtime: op.remoteMtime }),
			}),
		),
	];
	return lines.join("\n") + "\n";
}

async function loadPlan(file: string): Promise<SyncPlan> {
	const lines = (await readFile(file, "utf-8")).split("\n").filter((line) => line.trim());
	if (!lines.length) {
		throw new Error(`Empty plan file: ${file}`);
	}
	const header = JSON.parse(lines[0]);
	if (header.type !== "header") {
		throw new Error("Invalid plan file: expected header as first line");
	}
	const operations: SyncOperation[] = [];
	for (const line of lines.slice(1)) {
		const op = JSON.parse(line);
		if (op.type !== "operation") {
			continue;
		}
		operations.push({
			action: op.action,
			path: op.path,
			size: op.size ?? undefined,
			reason: op.reason ?? "",
			localMtime: op.local_mtime ?? undefined,
			remoteMtime: op.remote_mtime ?? undefined,
		});
	}
	return { source: header.source, dest: header.dest, timestamp: header.timestamp, operations };
}

function bucketUri(path: string): HfUri | undefined {
	if (!isHfUri(path)) {
		return undefined;
	}
	const uri = parseHfUri(path);
	if (uri.type !== "bucket") {
		throw new TypeError(`Invalid bucket path: ${path}. Must be a bucket URI (hf://buckets/...).`);
	}
	return uri;
}

async function listRemoteFiles(
	bucket: string,
	prefix: string,
	opts: CommonOptions,
): Promise<Array<{ rel: string } & FileInfo>> {
	const files: Array<{ rel: string } & FileInfo> = [];
	for (const entry of await listRemote(bucket, prefix, { ...opts, recursive: true })) {
		if (entry.type !== "file") {
			continue;
		}
		let rel: string;
		if (prefix) {
			if (entry.path.startsWith(`${prefix}/`)) {
				rel = entry.path.slice(prefix.length + 1);
			} else if (entry.path === prefix) {
				rel = basename(entry.path);
			} else {
				continue;
			}
		} else {
			rel = entry.path;
		}
		files.push({ rel, size: entry.size, mtime: entry.mtime ? Date.parse(entry.mtime) : 0 });
	}
	return files;
}

function compareFiles(args: {
	path: string;
	action: "upload" | "download";
	source: FileInfo;
	dest: FileInfo;
	sourceNewerLabel: string;
	destNewerLabel: string;
	ignoreSizes?: boolean;
	ignoreTimes?: boolean;
	ignoreExisting?: boolean;
	localMtime: number;
	remoteMtime: number;
}): SyncOperation {
	const { path, action, source, dest } = args;
	const base = {
		path,
		size: source.size,
		localMtime: mtimeToIso(args.localMtime),
		remoteMtime: mtimeToIso(args.remoteMtime),
	};

	if (args.ignoreExisting) {
		return { action: "skip", reason: "exists on receiver (--ignore-existing)", ...base };
	}

	const sizeDiffers = source.size !== dest.size;
	const sourceNewer = source.mtime - dest.mtime > SYNC_TIME_WINDOW_MS;

	if (args.ignoreSizes) {
		if (sourceNewer) {
			return { action, reason: args.sourceNewerLabel, ...base };
		}
		const destNewer = dest.mtime - source.mtime > SYNC_TIME_WINDOW_MS;
		return { action: "skip", reason: destNewer ? args.destNewerLabel : "same mtime", ...base };
	}
	if (args.ignoreTimes) {
		return sizeDiffers ? { action, reason: "size differs", ...base } : { action: "skip", reason: "same size", ...base };
	}
	if (sizeDiffers || sourceNewer) {
		return { action, reason: sizeDiffers ? "size differs" : args.sourceNewerLabel, ...base };
	}
	return { action: "skip", reason: "identical", ...base };
}

interface ComputeOptions extends CommonOptions {
	delete?: boolean;
	ignoreTimes?: boolean;
	ignoreSizes?: boolean;
	existing?: boolean;
	ignoreExisting?: boolean;
	matcher: FilterMatcher;
}

async function computePlan(source: string, dest: string, opts: ComputeOptions): Promise<SyncPlan> {
	const sourceBucket = bucketUri(source);
	const destBucket = bucketUri(dest);
	const isUpload = !sourceBucket && !!destBucket;
	const plan: SyncPlan = { source, dest, timestamp: new Date().toISOString().replace("Z", "+00:00"), operations: [] };
	const operations = plan.operations;
	const action = isUpload ? "upload" : "download";

	const remote = (destBucket ?? sourceBucket) as HfUri;
	const localPath = resolve(isUpload ? source : dest);

	const remoteFiles = new Map<string, FileInfo>();
	try {
		for (const file of await listRemoteFiles(remote.id, remote.path, opts)) {
			if (opts.matcher.matches(file.rel)) {
				remoteFiles.set(file.rel, file);
			}
		}
	} catch (error) {
		// A bucket that doesn't exist yet is treated as empty when uploading
		if (!(isUpload && error instanceof HubApiError && error.statusCode === 404)) {
			throw error;
		}
	}

	const localFiles = new Map<string, FileInfo>();
	if (isUpload || opts.delete) {
		const dirInfo = await walkLocal(localPath).catch((error) => {
			if (isUpload) {
				throw error;
			}
			return [];
		});
		for (const { rel, abs } of dirInfo) {
			const info = opts.matcher.matches(rel) ? await statLocal(abs) : null;
			if (info) {
				localFiles.set(rel, info);
			}
		}
	} else {
		// Without --delete, only paths that exist remotely matter
		for (const rel of remoteFiles.keys()) {
			const info = await statLocal(join(localPath, rel));
			if (info) {
				localFiles.set(rel, info);
			}
		}
	}

	const sourceFiles = isUpload ? localFiles : remoteFiles;
	const destFiles = isUpload ? remoteFiles : localFiles;
	const paths = [...new Set([...sourceFiles.keys(), ...destFiles.keys()])].sort();

	for (const path of paths) {
		const src = sourceFiles.get(path);
		const dst = destFiles.get(path);

		if (src && !dst) {
			const mtime = isUpload ? { localMtime: mtimeToIso(src.mtime) } : { remoteMtime: mtimeToIso(src.mtime) };
			operations.push(
				opts.existing
					? { action: "skip", path, size: src.size, reason: "new file (--existing)", ...mtime }
					: { action, path, size: src.size, reason: "new file", ...mtime },
			);
		} else if (src && dst) {
			operations.push(
				compareFiles({
					path,
					action,
					source: src,
					dest: dst,
					sourceNewerLabel: isUpload ? "local newer" : "remote newer",
					destNewerLabel: isUpload ? "remote newer" : "local newer",
					ignoreSizes: opts.ignoreSizes,
					ignoreTimes: opts.ignoreTimes,
					ignoreExisting: opts.ignoreExisting,
					localMtime: isUpload ? src.mtime : dst.mtime,
					remoteMtime: isUpload ? dst.mtime : src.mtime,
				}),
			);
		} else if (!src && dst && opts.delete) {
			operations.push({
				action: "delete",
				path,
				size: dst.size,
				reason: "not in source (--delete)",
				...(isUpload ? { remoteMtime: mtimeToIso(dst.mtime) } : { localMtime: mtimeToIso(dst.mtime) }),
			});
		}
	}

	return plan;
}

async function executePlan(plan: SyncPlan, opts: CommonOptions & { verbose?: boolean }): Promise<void> {
	const sourceBucket = bucketUri(plan.source);
	const destBucket = bucketUri(plan.dest);
	const isUpload = !sourceBucket && !!destBucket;
	if (isUpload === !!sourceBucket) {
		throw new Error("Invalid plan: exactly one of source and dest must be a bucket path (hf://buckets/...).");
	}

	// The plan file is untrusted input: its paths end up joined to a local directory
	for (const op of plan.operations) {
		validateRelativeFilename(op.path);
	}

	const log = (label: string, op: SyncOperation) => {
		if (opts.verbose && !opts.quiet) {
			console.log(`  ${label}: ${op.path} (${op.reason})`);
		}
	};

	const remote = (destBucket ?? sourceBucket) as HfUri;
	const localPath = resolve(isUpload ? plan.source : plan.dest);
	const remotePath = (path: string) => joinRemote(remote.path, path);

	const uploads: SyncOperation[] = [];
	const downloads: SyncOperation[] = [];
	const deletes: SyncOperation[] = [];
	for (const op of plan.operations) {
		if (op.action === "upload") {
			log("Uploading", op);
			uploads.push(op);
		} else if (op.action === "download") {
			log("Downloading", op);
			downloads.push(op);
		} else if (op.action === "delete") {
			log("Deleting", op);
			deletes.push(op);
		} else {
			log("Skipping", op);
		}
	}

	if (isUpload) {
		if (uploads.length) {
			const files = await Promise.all(
				uploads.map(async (op) => {
					const abs = join(localPath, op.path);
					const info = await statLocal(abs);
					if (!info) {
						throw new Error(`Local file not found: ${abs}`);
					}
					return { path: remotePath(op.path), content: pathToFileURL(abs), mtime: Math.trunc(info.mtime) };
				}),
			);
			for (let i = 0; i < files.length; i += BATCH_SIZE) {
				await uploadFiles({
					repo: repoOf(remote.id),
					files: files.slice(i, i + BATCH_SIZE),
					accessToken: opts.token,
					hubUrl: opts.hubUrl,
					useXet: true,
				});
			}
		}
		for (let i = 0; i < deletes.length; i += BATCH_SIZE) {
			await deleteFiles({
				repo: repoOf(remote.id),
				paths: deletes.slice(i, i + BATCH_SIZE).map((op) => remotePath(op.path)),
				accessToken: opts.token,
				hubUrl: opts.hubUrl,
			});
		}
		return;
	}

	await mkdir(localPath, { recursive: true });
	await promisesQueue(
		downloads.map((op) => async () => {
			const destination = join(localPath, op.path);
			const blob = await downloadFile({
				repo: repoOf(remote.id),
				path: remotePath(op.path),
				accessToken: opts.token,
				hubUrl: opts.hubUrl,
				xet: true,
			});
			if (!blob) {
				throw new Error(`File '${remotePath(op.path)}' not found in bucket '${remote.id}'`);
			}
			await mkdir(dirname(destination), { recursive: true });
			await streamBlobToFile(blob, destination);
		}),
		DOWNLOAD_CONCURRENCY,
	);

	for (const op of deletes) {
		const file = join(localPath, op.path);
		if (!(await statLocal(file))) {
			continue;
		}
		await unlink(file);
		// Remove empty parent directories
		let parent = dirname(file);
		while (parent !== localPath) {
			try {
				await rmdir(parent);
				parent = dirname(parent);
			} catch {
				break;
			}
		}
	}
}

function printSummary(plan: SyncPlan) {
	const summary = summarize(plan);
	console.log(`Sync plan: ${plan.source} -> ${plan.dest}`);
	console.log(`  Uploads: ${summary.uploads}`);
	console.log(`  Downloads: ${summary.downloads}`);
	console.log(`  Deletes: ${summary.deletes}`);
	console.log(`  Skips: ${summary.skips}`);
}

export async function bucketsSync(
	args: CommonOptions & {
		source?: string;
		dest?: string;
		delete?: boolean;
		ignoreTimes?: boolean;
		ignoreSizes?: boolean;
		existing?: boolean;
		ignoreExisting?: boolean;
		include?: string[];
		exclude?: string[];
		filterFrom?: string;
		plan?: string;
		apply?: string;
		dryRun?: boolean;
		verbose?: boolean;
	},
): Promise<void> {
	const { quiet } = args;

	if (args.apply) {
		const conflicting: Array<[string, unknown]> = [
			["source/dest", args.source || args.dest],
			["plan", args.plan],
			["delete", args.delete],
			["ignore-times", args.ignoreTimes],
			["ignore-sizes", args.ignoreSizes],
			["include", args.include?.length],
			["exclude", args.exclude?.length],
			["filter-from", args.filterFrom],
			["existing", args.existing],
			["ignore-existing", args.ignoreExisting],
			["dry-run", args.dryRun],
		];
		for (const [name, value] of conflicting) {
			if (value) {
				throw new Error(`Cannot specify ${name} when using --apply.`);
			}
		}

		const plan = await loadPlan(args.apply);
		if (!quiet) {
			printSummary(plan);
			console.log("Executing plan...");
		}
		await executePlan(plan, args);
		if (!quiet) {
			console.log("Sync completed.");
		}
		return;
	}

	const { source, dest } = args;
	if (!source || !dest) {
		throw new Error("Both source and dest are required (unless using --apply).");
	}
	const sourceBucket = bucketUri(source);
	const destBucket = bucketUri(dest);
	if (sourceBucket && destBucket) {
		throw new Error("Remote to remote sync is not supported. One path must be local.");
	}
	if (!sourceBucket && !destBucket) {
		throw new Error("One of source or dest must be a bucket path (hf://buckets/...).");
	}
	if (args.ignoreTimes && args.ignoreSizes) {
		throw new Error("Cannot specify both --ignore-times and --ignore-sizes.");
	}
	if (args.existing && args.ignoreExisting) {
		throw new Error("Cannot specify both --existing and --ignore-existing.");
	}
	if (args.dryRun && args.plan) {
		throw new Error("Cannot specify both --dry-run and --plan.");
	}

	if (sourceBucket) {
		const destInfo = await stat(dest).catch(() => null);
		if (destInfo && !destInfo.isDirectory()) {
			throw new Error(`Destination must be a directory: ${dest}`);
		}
	} else {
		const sourceInfo = await stat(source).catch(() => null);
		if (!sourceInfo?.isDirectory()) {
			throw new Error(`Source must be an existing directory: ${source}`);
		}
	}

	const matcher = new FilterMatcher(
		args.include,
		args.exclude,
		args.filterFrom ? await parseFilterFile(args.filterFrom) : [],
	);
	const plan = await computePlan(source, dest, { ...args, matcher });

	if (args.dryRun) {
		process.stdout.write(serializePlan(plan));
		return;
	}

	if (args.plan) {
		await writeFile(args.plan, serializePlan(plan));
		if (!quiet) {
			printSummary(plan);
			console.log(`Plan saved to: ${args.plan}`);
		}
		return;
	}

	if (!quiet) {
		printSummary(plan);
	}
	const summary = summarize(plan);
	if (!summary.uploads && !summary.downloads && !summary.deletes) {
		if (!quiet) {
			console.log("Nothing to sync.");
		}
		return;
	}
	if (!quiet) {
		console.log("Syncing...");
	}
	await executePlan(plan, args);
	if (!quiet) {
		console.log("Sync completed.");
	}
}
