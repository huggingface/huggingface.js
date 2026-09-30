import { mkdir, stat } from "node:fs/promises";
import { basename, dirname, join, resolve, relative, sep } from "node:path";
import { pathToFileURL } from "node:url";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import type { ReadableStream } from "node:stream/web";
import { createApiError } from "../error";
import { copyFiles, type CopyFilesEntry } from "../lib/copy-files";
import { deleteFiles } from "../lib/delete-files";
import { downloadFile } from "../lib/download-file";
import { fileExists } from "../lib/file-exists";
import { listFiles } from "../lib/list-files";
import { pathsInfo } from "../lib/paths-info";
import { uploadFiles } from "../lib/upload-files";
import { whoAmI } from "../lib/who-am-i";
import { isHfUri, parseHfUri, type HfUri } from "../utils/parseHfUri";
import { parseLinkHeader } from "../utils/parseLinkHeader";
import {
	FilterMatcher,
	confirm,
	formatSize,
	joinRemote,
	listRemote,
	repoOf,
	statLocal,
	stripSlashes,
	walkLocal,
	type CommonOptions,
} from "./bucket-utils";
import { readStdin, streamBlobToFile } from "./fs";

export { bucketsSync } from "./bucket-sync";

const BATCH_SIZE = 1000;

/** Accepts `hf://buckets/ns/name[/path]` as well as the bare `ns/name[/path]` form. */
function parseBucketRef(ref: string): HfUri {
	const uri = parseHfUri(ref.startsWith("hf://") ? ref : `hf://buckets/${ref}`);
	if (uri.type !== "bucket") {
		throw new TypeError(`Invalid bucket path: ${ref}. Must be a bucket URI (hf://buckets/...).`);
	}
	return uri;
}

/** Port of `_resolve_copy_target_path` from huggingface_hub. */
function resolveCopyTargetPath(args: {
	srcFilePath: string;
	srcRootPath?: string;
	isSingleFile: boolean;
	destinationPath: string;
	destinationIsDirectory: boolean;
	destinationExistsAsDirectory: boolean;
	mergeContents: boolean;
}): string {
	const { srcFilePath, srcRootPath, destinationPath } = args;
	const fileName = srcFilePath.split("/").at(-1) as string;
	if (args.isSingleFile) {
		if (destinationPath === "") {
			return fileName;
		}
		return args.destinationIsDirectory ? `${destinationPath.replace(/\/+$/, "")}/${fileName}` : destinationPath;
	}

	let relPath: string;
	if (srcRootPath === undefined) {
		relPath = srcFilePath;
	} else if (srcFilePath.startsWith(`${srcRootPath}/`)) {
		relPath = srcFilePath.slice(srcRootPath.length + 1);
	} else if (srcFilePath === srcRootPath) {
		relPath = fileName;
	} else {
		throw new Error(`Unexpected source path while copying folder: '${srcFilePath}'.`);
	}
	if (!relPath) {
		throw new Error("Cannot copy an empty relative path.");
	}

	// Without a trailing slash on the source, nest the source folder inside an existing destination directory
	if (args.destinationExistsAsDirectory && srcRootPath !== undefined && !args.mergeContents) {
		relPath = `${srcRootPath.split("/").at(-1)}/${relPath}`;
	}
	return destinationPath === "" ? relPath : `${destinationPath.replace(/\/+$/, "")}/${relPath}`;
}

/** Port of `HfApi.copy_files` for bucket destinations: server-side copy from a bucket or a repo. */
async function copyToBucket(source: string, destination: string, opts: CommonOptions): Promise<void> {
	const src = parseHfUri(source);
	const dst = parseHfUri(destination);
	const mergeContents = source.endsWith("/");
	const auth = { accessToken: opts.token, hubUrl: opts.hubUrl };
	const destRepo = repoOf(dst.id);
	const srcRepo = src.type === "bucket" ? repoOf(src.id) : { type: src.type, name: src.id };

	let destinationIsDirectory = false;
	let destinationExistsAsDirectory = false;
	if (dst.path === "") {
		destinationIsDirectory = true;
		destinationExistsAsDirectory = true;
	} else if (!(await fileExists({ repo: destRepo, path: dst.path, ...auth }))) {
		destinationExistsAsDirectory = (await listRemote(dst.id, dst.path, { ...opts, recursive: false })).length > 0;
		destinationIsDirectory = destinationExistsAsDirectory || destination.endsWith("/");
	}

	const targetPath = (srcFilePath: string, srcRootPath: string | undefined, isSingleFile: boolean) =>
		resolveCopyTargetPath({
			srcFilePath,
			srcRootPath,
			isSingleFile,
			destinationPath: dst.path,
			destinationIsDirectory,
			destinationExistsAsDirectory,
			mergeContents,
		});

	const sourceIsFile =
		src.path !== "" &&
		(src.type === "bucket"
			? await fileExists({ repo: srcRepo, path: src.path, ...auth })
			: (await pathsInfo({ repo: srcRepo, paths: [src.path], revision: src.revision, ...auth })).some(
					(info) => info.type === "file",
				));

	const files: CopyFilesEntry[] = [];
	const addFile = (path: string, destinationPath: string) =>
		files.push({ source: { repo: srcRepo, path, revision: src.revision }, destinationPath });

	if (sourceIsFile) {
		addFile(src.path, targetPath(src.path, undefined, true));
	} else {
		for await (const entry of listFiles({
			repo: srcRepo,
			path: src.path || undefined,
			recursive: true,
			revision: src.revision,
			...auth,
		})) {
			if (entry.type !== "file") {
				continue;
			}
			if (src.type !== "bucket" && entry.path.split("/").at(-1) === ".gitattributes") {
				continue;
			}
			if (src.path && !(entry.path === src.path || entry.path.startsWith(`${src.path}/`))) {
				continue;
			}
			addFile(entry.path, targetPath(entry.path, src.path || undefined, false));
		}
	}

	if (!files.length) {
		throw new Error(`No files found at '${source}' in ${src.type} '${src.id}'.`);
	}

	for (let i = 0; i < files.length; i += BATCH_SIZE) {
		await copyFiles({ destination: destRepo, files: files.slice(i, i + BATCH_SIZE), ...auth });
	}
}

export async function bucketsCp(args: CommonOptions & { src: string; dst?: string }): Promise<void> {
	const { src, dst, quiet } = args;

	const srcIsHf = isHfUri(src);
	const dstIsHf = !!dst && isHfUri(dst);
	const srcUri = srcIsHf ? parseHfUri(src) : undefined;
	const dstUri = dstIsHf ? parseHfUri(dst) : undefined;
	const srcBucket = srcUri?.type === "bucket" ? srcUri : undefined;
	const dstBucket = dstUri?.type === "bucket" ? dstUri : undefined;

	if (srcUri && dstUri) {
		if (!dstBucket) {
			throw new Error(
				srcBucket ? "Bucket-to-repo copy is not supported." : "Copying to repos is not supported, only to buckets.",
			);
		}
		await copyToBucket(src, dst as string, args);
		if (!quiet) {
			console.log(`Copied ${src} to ${dst}`);
		}
		return;
	}

	const isStdin = src === "-";
	if (!srcBucket && !dstBucket && !isStdin) {
		throw new Error(
			dst === undefined
				? "Missing destination. Provide a bucket path as DST."
				: "One of SRC or DST must be a bucket path (hf://buckets/...).",
		);
	}
	if (isStdin && !dstBucket) {
		throw new Error("Stdin upload requires a bucket destination.");
	}
	if (dst === "-" && !srcBucket) {
		throw new Error("Cannot pipe to stdout for uploads.");
	}

	if (dstBucket) {
		const destIsDir = !dstBucket.path || (dst as string).endsWith("/");
		if (isStdin && destIsDir) {
			throw new Error("Stdin upload requires a full destination path including filename.");
		}
		const repo = repoOf(dstBucket.id);
		const auth = { accessToken: args.token, hubUrl: args.hubUrl };

		if (!isStdin && (await stat(src).catch(() => null))?.isDirectory()) {
			// `dir` nests the directory under the destination, `dir/` copies its contents only
			const root = resolve(src);
			const prefix = src.endsWith("/") || src.endsWith(sep) ? "" : basename(root);
			const files = await Promise.all(
				(await walkLocal(root)).map(async (file) => ({
					path: joinRemote(dstBucket.path, prefix, file.rel),
					content: pathToFileURL(file.abs),
					mtime: Math.trunc((await statLocal(file.abs))?.mtime ?? Date.now()),
				})),
			);
			for (let i = 0; i < files.length; i += BATCH_SIZE) {
				await uploadFiles({ repo, files: files.slice(i, i + BATCH_SIZE), ...auth, useXet: true });
			}
			if (!quiet) {
				console.log(
					`Uploaded ${files.length} file(s) from ${src} to hf://buckets/${dstBucket.id}/${joinRemote(dstBucket.path, prefix)}`,
				);
			}
			return;
		}

		const path = destIsDir ? joinRemote(dstBucket.path, basename(src)) : dstBucket.path;
		let content: Blob | URL;
		let mtime: number;
		if (isStdin) {
			content = new Blob([await readStdin()]);
			mtime = Date.now();
		} else {
			const info = await statLocal(src);
			if (!info) {
				throw new Error(`Source file not found: ${src}`);
			}
			content = pathToFileURL(src);
			mtime = Math.trunc(info.mtime);
		}
		await uploadFiles({ repo, files: [{ path, content, mtime }], ...auth, useXet: true });
		if (!quiet) {
			console.log(`Uploaded ${isStdin ? "stdin" : src} to hf://buckets/${dstBucket.id}/${path}`);
		}
		return;
	}

	if (!srcBucket) {
		return;
	}

	const remotePath = srcBucket.path;
	const wantsDirectory = !remotePath || src.endsWith("/");

	if (!wantsDirectory) {
		const blob = await downloadFile({
			repo: repoOf(srcBucket.id),
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
			const destination = isDirectory ? join(dst ?? ".", basename(remotePath)) : (dst as string);
			await mkdir(dirname(destination), { recursive: true });
			await streamBlobToFile(blob, destination);
			if (!quiet) {
				console.log(`Downloaded ${src} to ${destination}`);
			}
			return;
		}
	}

	const entries = (await listRemote(srcBucket.id, remotePath, { ...args, recursive: true })).filter(
		(entry) => entry.type === "file",
	);
	if (!entries.length) {
		console.error(`Error: '${remotePath}' not found in bucket '${srcBucket.id}'.`);
		process.exitCode = 1;
		return;
	}
	if (dst === "-") {
		throw new Error("Cannot copy a directory to stdout");
	}

	// `dir` nests the directory under the destination, `dir/` (or the bucket root) copies its contents only
	const root = join(dst ?? ".", wantsDirectory ? "" : basename(remotePath));
	const base = remotePath ? `${remotePath}/` : "";
	for (const entry of entries) {
		const destination = resolve(root, entry.path.slice(base.length));
		if (relative(resolve(root), destination).startsWith("..")) {
			throw new Error(`Refusing to write outside of ${root}: ${entry.path}`);
		}
		const blob = await downloadFile({
			repo: repoOf(srcBucket.id),
			path: entry.path,
			accessToken: args.token,
			hubUrl: args.hubUrl,
			xet: true,
		});
		if (!blob) {
			throw new Error(`File '${entry.path}' not found in bucket '${srcBucket.id}'.`);
		}
		await mkdir(dirname(destination), { recursive: true });
		await streamBlobToFile(blob, destination);
	}
	if (!quiet) {
		console.log(`Downloaded ${entries.length} file(s) from ${src} to ${root}`);
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

	const { id: bucket, path } = parseBucketRef(ref as string);
	const entries = await listRemote(bucket, path, { ...args, recursive: !!(args.recursive || args.tree) });

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
				(entry.mtime ?? entry.uploadedAt ?? "").slice(0, 19).padEnd(19),
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
	const { id: bucket, path: prefix } = parseBucketRef(args.argument);
	const repo = repoOf(bucket);
	const auth = { accessToken: args.token, hubUrl: args.hubUrl };

	if (prefix === "" && !args.recursive) {
		throw new Error(
			`No file path specified. To remove files, provide a path (e.g. '${bucket}/FILE') or use --recursive to remove all files. To delete the entire bucket, use \`hf buckets delete ${bucket}\`.`,
		);
	}
	if ((args.include?.length || args.exclude?.length) && !args.recursive) {
		throw new Error("--include and --exclude require --recursive.");
	}

	if (!args.recursive) {
		if (args.dryRun) {
			console.log(`delete: hf://buckets/${bucket}/${prefix}`);
			console.log("(dry run) 1 file would be removed.");
			return;
		}
		if (!args.yes && !(await confirm(`Remove '${prefix}' from '${bucket}'?`))) {
			console.log("Aborted.");
			process.exitCode = 1;
			return;
		}
		await deleteFiles({ repo, paths: [prefix], ...auth });
		if (!args.quiet) {
			console.log(`File removed: ${prefix}`);
		}
		return;
	}

	const matcher = new FilterMatcher(args.include, args.exclude);
	const files = (await listRemote(bucket, prefix, { ...args, recursive: true })).filter(
		(entry) => entry.type === "file" && matcher.matches(entry.path),
	);
	if (!files.length) {
		console.log("No files to remove.");
		return;
	}

	const label = `${files.length} file(s) totaling ${formatSize(
		files.reduce((total, file) => total + file.size, 0),
		true,
	)}`;
	if (args.dryRun) {
		files.forEach((file) => console.log(`delete: hf://buckets/${bucket}/${file.path}`));
		console.log(`(dry run) ${label} would be removed.`);
		return;
	}
	if (!args.yes) {
		console.log(files.map((file) => `  ${file.path}`).join("\n"));
		if (!(await confirm(`Remove ${label} from '${bucket}'?`))) {
			console.log("Aborted.");
			process.exitCode = 1;
			return;
		}
	}

	for (let i = 0; i < files.length; i += BATCH_SIZE) {
		await deleteFiles({ repo, paths: files.slice(i, i + BATCH_SIZE).map((file) => file.path), ...auth });
	}
	if (!args.quiet) {
		console.log(`Removed ${label} from '${bucket}'`);
	}
}
