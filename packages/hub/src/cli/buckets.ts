import { mkdir, readdir, stat, unlink, utimes } from "node:fs/promises";
import { createInterface } from "node:readline/promises";
import { basename, dirname, join, relative, resolve, sep } from "node:path";
import { pathToFileURL } from "node:url";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import type { ReadableStream } from "node:stream/web";
import { createApiError } from "../error";
import { deleteFiles } from "../lib/delete-files";
import { downloadFile } from "../lib/download-file";
import { fileExists } from "../lib/file-exists";
import type { ListFileEntry } from "../lib/list-files";
import { listFiles } from "../lib/list-files";
import { globMatch } from "../lib/parse-safetensors-metadata";
import { uploadFile } from "../lib/upload-file";
import { uploadFiles } from "../lib/upload-files";
import { whoAmI } from "../lib/who-am-i";
import { parseBucketUri, type BucketUri } from "../utils/parseBucketUri";
import { parseLinkHeader } from "../utils/parseLinkHeader";
import { validateRelativeFilename } from "../utils/validateRelativeFilename";
import { readStdin, streamBlobToFile } from "./fs";

interface CommonOptions {
	token: string;
	hubUrl: string;
	quiet?: boolean;
}

const SYNC_TIME_WINDOW_MS = 1000;
const DELETE_BATCH_SIZE = 1000;

const repoOf = (bucket: string) => ({ type: "bucket" as const, name: bucket });

/** Accepts `hf://buckets/ns/name[/path]` as well as the bare `ns/name[/path]` form. */
function parseBucketRef(ref: string): BucketUri {
	const parsed = parseBucketUri(ref.startsWith("hf://") ? ref : `hf://buckets/${ref}`);
	return parsed as BucketUri;
}

const stripSlashes = (path: string) => path.replace(/^\/+|\/+$/g, "");
const joinRemote = (...parts: string[]) => parts.map(stripSlashes).filter(Boolean).join("/");

async function listRemote(
	bucket: string,
	prefix: string,
	opts: CommonOptions & { recursive: boolean; expand?: boolean },
): Promise<ListFileEntry[]> {
	const entries: ListFileEntry[] = [];
	for await (const entry of listFiles({
		repo: repoOf(bucket),
		path: stripSlashes(prefix) || undefined,
		recursive: opts.recursive,
		expand: opts.expand,
		accessToken: opts.token,
		hubUrl: opts.hubUrl,
	})) {
		entries.push(entry);
	}
	return entries;
}

async function walkLocal(dir: string): Promise<Array<{ rel: string; abs: string }>> {
	const files: Array<{ rel: string; abs: string }> = [];
	const walk = async (current: string) => {
		for (const entry of await readdir(current, { withFileTypes: true })) {
			const abs = join(current, entry.name);
			if (entry.isDirectory()) {
				await walk(abs);
			} else if (entry.isFile()) {
				files.push({ rel: relative(dir, abs).split(sep).join("/"), abs });
			}
		}
	};
	await walk(dir);
	return files;
}

function makeFilter(include?: string[], exclude?: string[]) {
	return (path: string) =>
		(!include?.length || include.some((pattern) => globMatch(pattern, path))) &&
		!exclude?.some((pattern) => globMatch(pattern, path));
}

async function confirm(message: string): Promise<boolean> {
	const rl = createInterface({ input: process.stdin, output: process.stdout });
	try {
		return /^y(es)?$/i.test((await rl.question(`${message} [y/N] `)).trim());
	} finally {
		rl.close();
	}
}

function formatSize(size: number, humanReadable?: boolean): string {
	if (!humanReadable) {
		return String(size);
	}
	const units = ["B", "K", "M", "G", "T"];
	let value = size;
	let unit = 0;
	while (value >= 1024 && unit < units.length - 1) {
		value /= 1024;
		unit++;
	}
	return unit === 0 ? `${value}B` : `${value.toFixed(1)}${units[unit]}`;
}

async function downloadBucketFile(
	bucket: string,
	path: string,
	destination: string,
	opts: CommonOptions,
	mtime?: Date,
): Promise<boolean> {
	const blob = await downloadFile({
		repo: repoOf(bucket),
		path,
		accessToken: opts.token,
		hubUrl: opts.hubUrl,
		xet: true,
	});
	if (!blob) {
		return false;
	}
	await mkdir(dirname(destination), { recursive: true });
	await streamBlobToFile(blob, destination);
	if (mtime) {
		await utimes(destination, mtime, mtime);
	}
	return true;
}

export async function bucketsCp(args: CommonOptions & { src: string; dst?: string }): Promise<void> {
	const { src, dst, quiet } = args;
	const srcBucket = parseBucketUri(src);
	const dstBucket = dst ? parseBucketUri(dst) : undefined;

	if (srcBucket && dstBucket) {
		throw new Error("Copying between buckets is not supported");
	}
	if (!srcBucket && !dstBucket) {
		throw new Error("Either the source or the destination must be a bucket URI (hf://buckets/namespace/name[/path])");
	}

	if (dstBucket) {
		const isStdin = src === "-";
		const destIsDir = !dstBucket.path || dstBucket.path.endsWith("/");
		if (isStdin && destIsDir) {
			throw new Error("Uploading from stdin requires a destination file path in the bucket");
		}
		const repo = repoOf(dstBucket.bucket);

		if (!isStdin && (await stat(src)).isDirectory()) {
			// `dir` nests the directory under the destination, `dir/` copies its contents only
			const root = resolve(src);
			const prefix = src.endsWith("/") || src.endsWith(sep) ? "" : basename(root);
			const files = await walkLocal(root);
			await uploadFiles({
				repo,
				files: files.map((file) => ({
					path: joinRemote(dstBucket.path, prefix, file.rel),
					content: pathToFileURL(file.abs),
				})),
				accessToken: args.token,
				hubUrl: args.hubUrl,
				useXet: true,
			});
			if (!quiet) {
				console.log(
					`✅ Uploaded ${files.length} file(s) from ${src} to hf://buckets/${dstBucket.bucket}/${joinRemote(dstBucket.path, prefix)}`,
				);
			}
			return;
		}

		const path = destIsDir ? joinRemote(dstBucket.path, basename(src)) : dstBucket.path;
		const content = isStdin ? new Blob([await readStdin()]) : pathToFileURL(src);
		await uploadFile({ repo, file: { path, content }, accessToken: args.token, hubUrl: args.hubUrl, useXet: true });
		if (!quiet) {
			console.log(`✅ Uploaded ${isStdin ? "stdin" : src} to hf://buckets/${dstBucket.bucket}/${path}`);
		}
		return;
	}

	if (!srcBucket) {
		return;
	}

	const remotePath = stripSlashes(srcBucket.path);
	const wantsDirectory = !remotePath || srcBucket.path.endsWith("/");

	if (!wantsDirectory) {
		const blob = await downloadFile({
			repo: repoOf(srcBucket.bucket),
			path: remotePath,
			accessToken: args.token,
			hubUrl: args.hubUrl,
			xet: true,
		});
		if (blob) {
			if (dst === "-") {
				await pipeline(Readable.fromWeb(blob.stream() as ReadableStream), process.stdout, { end: false });
				return;
			}
			const isDirectory = !dst || dst.endsWith("/") || (await stat(dst).catch(() => null))?.isDirectory();
			const destination = isDirectory ? join(dst ?? ".", basename(remotePath)) : dst;
			await mkdir(dirname(destination), { recursive: true });
			await streamBlobToFile(blob, destination);
			if (!quiet) {
				console.log(`✅ Downloaded ${src} to ${destination}`);
			}
			return;
		}
	}

	const entries = (await listRemote(srcBucket.bucket, remotePath, { ...args, recursive: true })).filter(
		(entry) => entry.type === "file",
	);
	if (!entries.length) {
		console.error(`Error: '${remotePath}' not found in bucket '${srcBucket.bucket}'.`);
		process.exitCode = 1;
		return;
	}

	if (dst === "-") {
		throw new Error("Cannot copy a directory to stdout");
	}

	// `dir` nests the directory under the destination, `dir/` (or the bucket root) copies its contents only
	const nest = wantsDirectory ? "" : basename(remotePath);
	const root = join(dst ?? ".", nest);
	const base = remotePath ? `${remotePath}/` : "";
	for (const entry of entries) {
		const rel = entry.path.slice(base.length);
		const destination = resolve(root, rel);
		if (relative(resolve(root), destination).startsWith("..")) {
			throw new Error(`Refusing to write outside of ${root}: ${entry.path}`);
		}
		await downloadBucketFile(srcBucket.bucket, entry.path, destination, args);
	}
	if (!quiet) {
		console.log(`✅ Downloaded ${entries.length} file(s) from ${src} to ${root}`);
	}
}

interface BucketListItem {
	id: string;
	private?: boolean;
	size?: number;
	totalFiles?: number;
	createdAt?: string;
}

async function listBuckets(namespace: string, opts: CommonOptions & { search?: string }): Promise<BucketListItem[]> {
	const items: BucketListItem[] = [];
	const params = new URLSearchParams();
	if (opts.search) {
		params.set("search", opts.search);
	}
	let url: string | undefined = `${opts.hubUrl}/api/buckets/${encodeURIComponent(namespace)}?${params}`;
	while (url) {
		const res: Response = await fetch(url, {
			headers: { accept: "application/json", ...(opts.token && { Authorization: `Bearer ${opts.token}` }) },
		});
		if (!res.ok) {
			throw await createApiError(res);
		}
		for (const item of (await res.json()) as Array<Record<string, unknown>>) {
			items.push({
				id: String(item.id),
				private: item.private as boolean | undefined,
				size: item.size as number | undefined,
				totalFiles: (item.totalFiles ?? item.total_files) as number | undefined,
				createdAt: (item.createdAt ?? item.created_at) as string | undefined,
			});
		}
		const link = res.headers.get("Link");
		url = link ? parseLinkHeader(link).next : undefined;
	}
	return items;
}

export async function bucketsLs(
	args: CommonOptions & {
		argument?: string;
		humanReadable?: boolean;
		tree?: boolean;
		recursive?: boolean;
		search?: string;
	},
): Promise<void> {
	const ref = args.argument?.startsWith("hf://buckets/") ? args.argument.slice("hf://buckets/".length) : args.argument;
	const segments = stripSlashes(ref ?? "")
		.split("/")
		.filter(Boolean);

	if (segments.length < 2) {
		if (args.tree || args.recursive) {
			throw new Error("--tree and --recursive only apply when listing files in a bucket");
		}
		const namespace = segments[0] ?? (await whoAmI({ accessToken: args.token, hubUrl: args.hubUrl })).name;
		for (const bucket of await listBuckets(namespace, args)) {
			if (args.quiet) {
				console.log(bucket.id);
			} else {
				console.log(
					[
						bucket.private ? "private" : "public ",
						formatSize(bucket.size ?? 0, args.humanReadable).padStart(10),
						String(bucket.totalFiles ?? 0).padStart(8),
						(bucket.createdAt ?? "").slice(0, 19).padEnd(19),
						bucket.id,
					].join("  "),
				);
			}
		}
		return;
	}

	const { bucket, path } = parseBucketRef(ref as string);
	const entries = await listRemote(bucket, path, { ...args, recursive: !!(args.recursive || args.tree), expand: true });

	if (args.tree) {
		const prefix = stripSlashes(path);
		const shown = new Set<string>();
		for (const entry of entries) {
			const rel = (prefix ? entry.path.slice(prefix.length + 1) : entry.path).split("/");
			rel.forEach((name, depth) => {
				const key = rel.slice(0, depth + 1).join("/");
				if (shown.has(key)) {
					return;
				}
				shown.add(key);
				const isFile = depth === rel.length - 1 && entry.type === "file";
				const size = isFile && !args.quiet ? `  (${formatSize(entry.size, args.humanReadable)})` : "";
				console.log(`${"  ".repeat(depth)}${name}${isFile ? "" : "/"}${size}`);
			});
		}
		return;
	}

	for (const entry of entries) {
		if (args.quiet) {
			console.log(entry.path);
			continue;
		}
		const isDir = entry.type === "directory";
		console.log(
			[
				isDir ? "".padStart(10) : formatSize(entry.size, args.humanReadable).padStart(10),
				(entry.uploadedAt ?? "").slice(0, 19).padEnd(19),
				isDir ? `${entry.path}/` : entry.path,
			].join("  "),
		);
	}
}

export async function bucketsRm(
	args: CommonOptions & {
		argument: string;
		recursive?: boolean;
		yes?: boolean;
		dryRun?: boolean;
		include?: string[];
		exclude?: string[];
	},
): Promise<void> {
	const { bucket, path } = parseBucketRef(args.argument);
	const prefix = stripSlashes(path);
	const repo = repoOf(bucket);

	if ((args.include?.length || args.exclude?.length) && !args.recursive) {
		throw new Error("--include and --exclude require --recursive");
	}

	let paths: string[];
	if (args.recursive) {
		const matches = makeFilter(args.include, args.exclude);
		const base = prefix ? `${prefix}/` : "";
		paths = (await listRemote(bucket, prefix, { ...args, recursive: true }))
			.filter((entry) => entry.type === "file" && matches(entry.path.slice(base.length)))
			.map((entry) => entry.path);
	} else {
		if (!prefix) {
			throw new Error("Specify a file path, or use --recursive to remove all files in the bucket");
		}
		if (!(await fileExists({ repo, path: prefix, accessToken: args.token, hubUrl: args.hubUrl }))) {
			throw new Error(`File '${prefix}' not found in bucket '${bucket}'. Use --recursive to remove a directory`);
		}
		paths = [prefix];
	}

	if (!paths.length) {
		if (!args.quiet) {
			console.log("Nothing to remove.");
		}
		return;
	}

	if (args.dryRun) {
		paths.forEach((path) => console.log(`would remove ${path}`));
		return;
	}

	if (!args.yes && !(await confirm(`Remove ${paths.length} file(s) from ${bucket}?`))) {
		console.log("Aborted.");
		process.exitCode = 1;
		return;
	}

	for (let i = 0; i < paths.length; i += DELETE_BATCH_SIZE) {
		await deleteFiles({
			repo,
			paths: paths.slice(i, i + DELETE_BATCH_SIZE),
			accessToken: args.token,
			hubUrl: args.hubUrl,
		});
	}
	if (!args.quiet) {
		console.log(`✅ Removed ${paths.length} file(s) from ${bucket}`);
	}
}

interface SyncFile {
	size: number;
	mtime: number;
}

interface SyncOperation {
	action: "upload" | "download" | "delete" | "skip";
	path: string;
	size: number;
	reason: string;
}

function compareForSync(
	source: SyncFile,
	dest: SyncFile,
	opts: { ignoreSizes?: boolean; ignoreTimes?: boolean },
): { transfer: boolean; reason: string } {
	const sourceNewer = source.mtime - dest.mtime > SYNC_TIME_WINDOW_MS;
	const sizeDiffers = source.size !== dest.size;
	if (opts.ignoreSizes) {
		return { transfer: sourceNewer, reason: sourceNewer ? "source newer" : "not newer" };
	}
	if (opts.ignoreTimes) {
		return { transfer: sizeDiffers, reason: sizeDiffers ? "size differs" : "same size" };
	}
	if (sizeDiffers || sourceNewer) {
		return { transfer: true, reason: sizeDiffers ? "size differs" : "source newer" };
	}
	return { transfer: false, reason: "identical" };
}

export async function bucketsSync(
	args: CommonOptions & {
		source: string;
		dest: string;
		delete?: boolean;
		ignoreTimes?: boolean;
		ignoreSizes?: boolean;
		dryRun?: boolean;
		include?: string[];
		exclude?: string[];
		existing?: boolean;
		ignoreExisting?: boolean;
		verbose?: boolean;
	},
): Promise<void> {
	const srcBucket = parseBucketUri(args.source);
	const dstBucket = parseBucketUri(args.dest);
	if (!!srcBucket === !!dstBucket) {
		throw new Error("Exactly one of source and destination must be a bucket URI (hf://buckets/namespace/name[/path])");
	}
	if (args.existing && args.ignoreExisting) {
		throw new Error("--existing and --ignore-existing cannot be used together");
	}

	const upload = !!dstBucket;
	const remote = (dstBucket ?? srcBucket) as BucketUri;
	const remotePrefix = stripSlashes(remote.path);
	const localDir = resolve(upload ? args.source : args.dest);
	const matches = makeFilter(args.include, args.exclude);

	if (upload && !(await stat(localDir).catch(() => null))?.isDirectory()) {
		throw new Error(`'${args.source}' is not a directory`);
	}

	const localFiles = new Map<string, SyncFile>();
	if ((await stat(localDir).catch(() => null))?.isDirectory()) {
		for (const file of await walkLocal(localDir)) {
			if (matches(file.rel)) {
				const info = await stat(file.abs);
				localFiles.set(file.rel, { size: info.size, mtime: info.mtimeMs });
			}
		}
	}

	const base = remotePrefix ? `${remotePrefix}/` : "";
	const remoteFiles = new Map<string, SyncFile>();
	for (const entry of await listRemote(remote.bucket, remotePrefix, { ...args, recursive: true, expand: true })) {
		const rel = entry.path.slice(base.length);
		if (entry.type === "file" && matches(rel)) {
			validateRelativeFilename(rel);
			remoteFiles.set(rel, { size: entry.size, mtime: entry.uploadedAt ? Date.parse(entry.uploadedAt) : 0 });
		}
	}

	const [sourceFiles, destFiles] = upload ? [localFiles, remoteFiles] : [remoteFiles, localFiles];
	const action = upload ? "upload" : "download";
	const plan: SyncOperation[] = [];

	for (const [path, source] of [...sourceFiles].sort(([a], [b]) => a.localeCompare(b))) {
		const dest = destFiles.get(path);
		if (!dest) {
			plan.push(
				args.existing
					? { action: "skip", path, size: source.size, reason: "new file (--existing)" }
					: { action, path, size: source.size, reason: "new file" },
			);
		} else if (args.ignoreExisting) {
			plan.push({ action: "skip", path, size: source.size, reason: "exists on receiver (--ignore-existing)" });
		} else {
			const { transfer, reason } = compareForSync(source, dest, args);
			plan.push({ action: transfer ? action : "skip", path, size: source.size, reason });
		}
	}
	if (args.delete) {
		for (const [path, dest] of [...destFiles].sort(([a], [b]) => a.localeCompare(b))) {
			if (!sourceFiles.has(path)) {
				plan.push({ action: "delete", path, size: dest.size, reason: "not in source (--delete)" });
			}
		}
	}

	if (args.dryRun) {
		plan.forEach((op) => console.log(JSON.stringify(op)));
		return;
	}

	if (args.verbose && !args.quiet) {
		plan.forEach((op) => console.log(`${op.action.padEnd(8)} ${op.path} (${op.reason})`));
	}

	const toTransfer = plan.filter((op) => op.action === action);
	const toDelete = plan.filter((op) => op.action === "delete");

	if (upload) {
		if (toTransfer.length) {
			await uploadFiles({
				repo: repoOf(remote.bucket),
				files: toTransfer.map((op) => ({
					path: joinRemote(remotePrefix, op.path),
					content: pathToFileURL(join(localDir, op.path)),
				})),
				accessToken: args.token,
				hubUrl: args.hubUrl,
				useXet: true,
			});
		}
		for (let i = 0; i < toDelete.length; i += DELETE_BATCH_SIZE) {
			await deleteFiles({
				repo: repoOf(remote.bucket),
				paths: toDelete.slice(i, i + DELETE_BATCH_SIZE).map((op) => joinRemote(remotePrefix, op.path)),
				accessToken: args.token,
				hubUrl: args.hubUrl,
			});
		}
	} else {
		for (const op of toTransfer) {
			const mtime = new Date(remoteFiles.get(op.path)?.mtime ?? Date.now());
			await downloadBucketFile(
				remote.bucket,
				joinRemote(remotePrefix, op.path),
				resolve(localDir, op.path),
				args,
				mtime,
			);
		}
		for (const op of toDelete) {
			await unlink(resolve(localDir, op.path));
		}
	}

	if (!args.quiet) {
		console.log(
			`✅ Synced: ${toTransfer.length} ${upload ? "uploaded" : "downloaded"}, ${toDelete.length} deleted, ${plan.length - toTransfer.length - toDelete.length} skipped`,
		);
	}
}
