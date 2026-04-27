import { HUB_URL } from "../consts";
import { createApiError } from "../error";
import type { CredentialsParams, RepoType } from "../types/public";
import { checkCredentials } from "../utils/checkCredentials";
import { pathsInfo } from "./paths-info";
import { listFiles } from "./list-files";
import { downloadFile } from "./download-file";

const COPY_BATCH_CHUNK_SIZE = 1000;

/** Internal handle for a bucket source/destination in copy operations. */
interface BucketCopyHandle {
	kind: "bucket";
	bucketId: string;
	path: string;
}

/** Internal handle for a repo (model/dataset/space) source in copy operations. */
interface RepoCopyHandle {
	kind: "repo";
	repoType: Exclude<RepoType, "bucket" | "kernel">;
	repoId: string;
	revision: string;
	path: string;
}

type CopyHandle = BucketCopyHandle | RepoCopyHandle;

/** Regex to match special refs that contain "/" (e.g. refs/convert/parquet, refs/pr/123). */
const SPECIAL_REFS_REVISION_REGEX = /^(refs\/convert\/\w+)|(refs\/pr\/\d+)$/;

/**
 * Parse an `hf://` handle into an internal {@link CopyHandle}.
 *
 * Supported formats:
 * - `hf://buckets/namespace/bucket-name/path/to/file`
 * - `hf://namespace/repo-name/path` (model)
 * - `hf://datasets/namespace/repo-name/path`
 * - `hf://spaces/namespace/repo-name/path`
 * - `hf://namespace/repo-name@revision/path`
 */
export function parseHfCopyHandle(hfHandle: string): CopyHandle {
	if (!hfHandle.startsWith("hf://")) {
		throw new CopyHandleError(`Invalid HF handle: '${hfHandle}'. Expected a path starting with 'hf://'.`);
	}

	const path = hfHandle.slice("hf://".length);

	// --- Bucket handle ---
	if (path.startsWith("buckets/")) {
		const remainder = path.slice("buckets/".length);
		const firstSlash = remainder.indexOf("/");
		if (firstSlash === -1) {
			throw new CopyHandleError(
				`Invalid bucket HF handle: '${hfHandle}'. Expected 'hf://buckets/<namespace>/<bucket-name>[/<path>]'.`,
			);
		}
		const secondSlash = remainder.indexOf("/", firstSlash + 1);
		const bucketId = secondSlash === -1 ? remainder : remainder.slice(0, secondSlash);
		const bucketPath = secondSlash === -1 ? "" : remainder.slice(secondSlash + 1).replace(/^\/+|\/+$/g, "");
		return { kind: "bucket", bucketId, path: bucketPath };
	}

	// --- Repo handle ---
	path.replace(/^\/+|\/+$/g, "");
	if (path === "") {
		throw new CopyHandleError(`Invalid HF handle: '${hfHandle}'.`);
	}

	const parts = path.split("/");
	let repoType: Exclude<RepoType, "bucket" | "kernel"> = "model";

	if (parts[0] === "datasets" || parts[0] === "spaces") {
		repoType = parts[0].slice(0, -1) as Exclude<RepoType, "bucket" | "kernel">;
		parts.shift();
	}

	if (parts.length < 2) {
		throw new CopyHandleError(
			`Invalid repo HF handle: '${hfHandle}'. Expected 'hf://<namespace>/<repo-name>[/<path>]' or with explicit repo type prefix.`,
		);
	}

	const namespace = parts[0];
	let repoNameWithRevision = parts[1];
	let remainingParts = parts.slice(2);
	let revision: string | undefined;

	if (repoNameWithRevision.includes("@")) {
		const [repoName, rev] = repoNameWithRevision.split("@", 2);
		repoNameWithRevision = repoName;
		revision = decodeURIComponent(rev);
	}

	if (revision === undefined) {
		revision = "main";
	} else if (remainingParts.length > 0) {
		// Check if the revision is actually a special ref like refs/convert/parquet
		const maybeSpecialRef = `${revision}/${remainingParts[0]}`;
		const match = SPECIAL_REFS_REVISION_REGEX.exec(maybeSpecialRef);
		if (match) {
			revision = match[0];
			const suffix = maybeSpecialRef.slice(revision.length).replace(/^\/+/, "");
			remainingParts = (suffix ? [suffix] : []).concat(remainingParts.slice(1));
		}
	}

	const repoPath = remainingParts.join("/").replace(/^\/+|\/+$/g, "");

	return {
		kind: "repo",
		repoType,
		repoId: `${namespace}/${repoNameWithRevision}`,
		revision,
		path: repoPath,
	};
}

// Re-export for public API
export type { BucketCopyHandle, RepoCopyHandle, CopyHandle };

/**
 * Copy files from a bucket or repository (model, dataset, space) to a bucket.
 *
 * Both individual files and entire folders are supported.
 *
 * Currently, only bucket destinations are supported. Copying to a repository is not yet implemented.
 *
 * @param params.source - Source location as an `hf://` handle. Can be a bucket path
 *   (e.g. `"hf://buckets/my-bucket/path/to/file"`) or a repo path
 *   (e.g. `"hf://username/my-model/weights.bin"`, `"hf://datasets/username/my-dataset/data/"`).
 * @param params.destination - Destination location as an `hf://` handle pointing to a bucket
 *   (e.g. `"hf://buckets/my-bucket/target/path"`).
 * @param params.accessToken - A valid user access token.
 * @param params.hubUrl - Custom Hub URL.
 * @param params.fetch - Custom fetch function.
 *
 * @throws {CopyHandleError} If the destination is not a bucket or if handles are invalid.
 *
 * @example
 * ```ts
 * import { copyFiles } from "@huggingface/hub";
 *
 * // Copy a single file between buckets
 * await copyFiles({
 *   source: "hf://buckets/my-bucket/data.bin",
 *   destination: "hf://buckets/other-bucket/data.bin",
 *   accessToken: "hf_...",
 * });
 *
 * // Copy a folder from a bucket to another bucket
 * await copyFiles({
 *   source: "hf://buckets/my-bucket/models/",
 *   destination: "hf://buckets/other-bucket/backup/",
 *   accessToken: "hf_...",
 * });
 *
 * // Copy a file from a model repo to a bucket
 * await copyFiles({
 *   source: "hf://username/my-model/model.safetensors",
 *   destination: "hf://buckets/my-bucket/",
 *   accessToken: "hf_...",
 * });
 * ```
 */
export async function copyFiles(
	params: {
		source: string;
		destination: string;
		hubUrl?: string;
		fetch?: typeof fetch;
	} & Partial<CredentialsParams>,
): Promise<void> {
	const accessToken = checkCredentials(params);
	const sourceHandle = parseHfCopyHandle(params.source);
	const destinationHandle = parseHfCopyHandle(params.destination);

	if (destinationHandle.kind !== "bucket") {
		throw new CopyHandleError("Bucket-to-repo and repo-to-repo copy are not supported. Destination must be a bucket.");
	}

	const destBucketId = destinationHandle.bucketId;
	const destPath = destinationHandle.path;

	// Determine if destination is an existing file or directory
	const destinationIsDirectory = await resolveDestinationIsDirectory(destBucketId, destPath, params, accessToken);

	// Collect all copy operations and pending downloads
	const copyOps: BucketCopyOperation[] = [];
	const pendingDownloads: Array<{ sourcePath: string; targetPath: string }> = [];
	const pendingUploads: Array<{ localPath?: string; blob: Blob; targetPath: string }> = [];

	// Resolve source files
	if (sourceHandle.kind === "bucket") {
		await resolveBucketSource(
			sourceHandle,
			destPath,
			destinationIsDirectory,
			destBucketId,
			copyOps,
			params,
			accessToken,
		);
	} else {
		await resolveRepoSource(
			sourceHandle,
			destPath,
			destinationIsDirectory,
			copyOps,
			pendingDownloads,
			params,
			accessToken,
		);
	}

	// Download non-xet files in parallel
	if (pendingDownloads.length > 0) {
		// At this point we know sourceHandle is a repo (only repos produce pending downloads)
		const sourceRepoHandle = sourceHandle as RepoCopyHandle;
		const downloadedBlobs = await Promise.all(
			pendingDownloads.map(async ({ sourcePath, targetPath }) => {
				const blob = await downloadFile({
					repo: { type: sourceRepoHandle.repoType, name: sourceRepoHandle.repoId },
					path: sourcePath,
					revision: sourceRepoHandle.revision,
					accessToken,
					hubUrl: params.hubUrl,
					fetch: params.fetch,
				});
				if (!blob) {
					throw new Error(`Failed to download file: ${sourcePath}`);
				}
				return { blob, targetPath };
			}),
		);
		pendingUploads.push(...downloadedBlobs);
	}

	// Upload downloaded files via bucket batch add
	if (pendingUploads.length > 0) {
		for (const chunk of chunkArray(pendingUploads, COPY_BATCH_CHUNK_SIZE)) {
			await bucketBatchAdd(destBucketId, chunk, params, accessToken);
		}
	}

	// Send server-side copies (no data transfer)
	if (copyOps.length > 0) {
		for (const chunk of chunkArray(copyOps, COPY_BATCH_CHUNK_SIZE)) {
			await bucketBatchCopy(destBucketId, chunk, params, accessToken);
		}
	}
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

interface BucketCopyOperation {
	destination: string;
	xetHash: string;
	size: number;
	sourceRepoType: string;
	sourceRepoId: string;
}

/**
 * Check whether `destPath` refers to an existing file or a directory in the bucket.
 * If neither exists, treat it as a directory (files will be placed under it).
 */
async function resolveDestinationIsDirectory(
	bucketId: string,
	destPath: string,
	params: { hubUrl?: string; fetch?: typeof fetch },
	accessToken: string | undefined,
): Promise<boolean> {
	if (destPath === "") return true;

	// Check if it's an existing file
	const pathInfos = await pathsInfo({
		repo: { type: "bucket", name: bucketId },
		paths: [destPath],
		accessToken,
		hubUrl: params.hubUrl,
		fetch: params.fetch,
	});
	if (pathInfos.length > 0) return false; // existing file

	// Check if it's an existing directory (any file starts with this prefix)
	for await (const entry of listFiles({
		repo: { type: "bucket", name: bucketId },
		path: destPath,
		recursive: false,
		accessToken,
		hubUrl: params.hubUrl,
		fetch: params.fetch,
	})) {
		return true; // directory exists
	}

	// Doesn't exist — treat as directory
	return true;
}

/** Resolve source files from a bucket — always server-side copy by xet hash. */
async function resolveBucketSource(
	sourceHandle: BucketCopyHandle,
	destPath: string,
	destinationIsDirectory: boolean,
	destBucketId: string,
	copyOps: BucketCopyOperation[],
	params: { hubUrl?: string; fetch?: typeof fetch },
	accessToken: string | undefined,
): Promise<void> {
	const sourcePath = sourceHandle.path;

	// Check if source is a single file
	const sourcePathInfos = await pathsInfo({
		repo: { type: "bucket", name: sourceHandle.bucketId },
		paths: [sourcePath],
		accessToken,
		hubUrl: params.hubUrl,
		fetch: params.fetch,
	});

	if (sourcePathInfos.length > 0) {
		// Single file
		const srcFile = sourcePathInfos[0];
		const targetPath = resolveTargetPath(srcFile.path, null, true, destPath, destinationIsDirectory);
		copyOps.push({
			destination: targetPath,
			xetHash: srcFile.xetHash!,
			size: srcFile.size,
			sourceRepoType: "bucket",
			sourceRepoId: sourceHandle.bucketId,
		});
		return;
	}

	// Source is a folder — list all matching files
	for await (const entry of listFiles({
		repo: { type: "bucket", name: sourceHandle.bucketId },
		path: sourcePath || undefined,
		recursive: true,
		accessToken,
		hubUrl: params.hubUrl,
		fetch: params.fetch,
	})) {
		if (entry.type !== "file") continue;
		if (sourcePath && !(entry.path === sourcePath || entry.path.startsWith(sourcePath + "/"))) {
			continue;
		}
		const targetPath = resolveTargetPath(entry.path, sourcePath || null, false, destPath, true);
		copyOps.push({
			destination: targetPath,
			xetHash: entry.xetHash!,
			size: entry.size,
			sourceRepoType: "bucket",
			sourceRepoId: sourceHandle.bucketId,
		});
	}
}

/** Resolve source files from a repo — copy by hash if xet-backed, download otherwise. */
async function resolveRepoSource(
	sourceHandle: RepoCopyHandle,
	destPath: string,
	destinationIsDirectory: boolean,
	copyOps: BucketCopyOperation[],
	pendingDownloads: Array<{ sourcePath: string; targetPath: string }>,
	params: { hubUrl?: string; fetch?: typeof fetch },
	accessToken: string | undefined,
): Promise<void> {
	const sourcePath = sourceHandle.path;
	const repo: { type: RepoType; name: string } = {
		type: sourceHandle.repoType,
		name: sourceHandle.repoId,
	};

	// Check if source is a single file
	let sourcePathInfos: Awaited<ReturnType<typeof pathsInfo>> = [];
	if (sourcePath !== "") {
		sourcePathInfos = await pathsInfo({
			repo,
			paths: [sourcePath],
			revision: sourceHandle.revision,
			accessToken,
			hubUrl: params.hubUrl,
			fetch: params.fetch,
		});
	}

	const singleFile = sourcePathInfos.length === 1 && sourcePathInfos[0].type === "file";

	if (singleFile) {
		const file = sourcePathInfos[0];
		const targetPath = resolveTargetPath(file.path, null, true, destPath, destinationIsDirectory);
		if (file.xetHash) {
			copyOps.push({
				destination: targetPath,
				xetHash: file.xetHash,
				size: file.size,
				sourceRepoType: sourceHandle.repoType,
				sourceRepoId: sourceHandle.repoId,
			});
		} else {
			pendingDownloads.push({ sourcePath: file.path, targetPath });
		}
		return;
	}

	// Source is a folder — list all files recursively
	for await (const entry of listFiles({
		repo,
		path: sourcePath || undefined,
		recursive: true,
		revision: sourceHandle.revision,
		accessToken,
		hubUrl: params.hubUrl,
		fetch: params.fetch,
	})) {
		if (entry.type !== "file") continue;
		const targetPath = resolveTargetPath(entry.path, sourcePath || null, false, destPath, true);
		if (entry.xetHash) {
			copyOps.push({
				destination: targetPath,
				xetHash: entry.xetHash,
				size: entry.size,
				sourceRepoType: sourceHandle.repoType,
				sourceRepoId: sourceHandle.repoId,
			});
		} else {
			pendingDownloads.push({ sourcePath: entry.path, targetPath });
		}
	}
}

/**
 * Given a source file path, compute the target path inside the destination bucket.
 */
function resolveTargetPath(
	srcFilePath: string,
	srcRootPath: string | null,
	isSingleFile: boolean,
	destPath: string,
	destinationIsDirectory: boolean,
): string {
	const basename = srcFilePath.split("/").pop()!;

	if (isSingleFile) {
		if (destPath === "") return basename;
		if (destinationIsDirectory) return `${destPath.replace(/\/+$/, "")}/${basename}`;
		return destPath;
	}

	// Folder copy: strip the source root prefix
	let relPath: string;
	if (srcRootPath === null) {
		relPath = srcFilePath;
	} else if (srcFilePath.startsWith(srcRootPath + "/")) {
		relPath = srcFilePath.slice(srcRootPath.length + 1);
	} else if (srcFilePath === srcRootPath) {
		relPath = basename;
	} else {
		throw new CopyHandleError(`Unexpected source path while copying folder: '${srcFilePath}'.`);
	}

	if (relPath === "") {
		throw new CopyHandleError("Cannot copy an empty relative path.");
	}

	if (destPath === "") return relPath;
	return `${destPath.replace(/\/+$/, "")}/${relPath}`;
}

/** Send a batch of server-side copy operations to the bucket. */
async function bucketBatchCopy(
	bucketId: string,
	ops: BucketCopyOperation[],
	params: { hubUrl?: string; fetch?: typeof fetch },
	accessToken: string | undefined,
): Promise<void> {
	const hubUrl = params.hubUrl ?? HUB_URL;
	const resp = await (params.fetch ?? fetch)(`${hubUrl}/api/buckets/${bucketId}/batch`, {
		method: "POST",
		headers: {
			...(accessToken && { Authorization: `Bearer ${accessToken}` }),
			"Content-Type": "application/x-ndjson",
		},
		body: ops
			.map((op) =>
				JSON.stringify({
					type: "copyFile",
					path: op.destination,
					xetHash: op.xetHash,
					sourceRepoType: op.sourceRepoType,
					sourceRepoId: op.sourceRepoId,
				}),
			)
			.join("\n"),
	});

	if (!resp.ok) {
		throw await createApiError(resp);
	}
}

/** Send a batch of file uploads to the bucket (for non-xet files that were downloaded). */
async function bucketBatchAdd(
	bucketId: string,
	files: Array<{ blob: Blob; targetPath: string }>,
	params: { hubUrl?: string; fetch?: typeof fetch },
	accessToken: string | undefined,
): Promise<void> {
	// For now, upload non-xet files through the commit API for buckets
	// TODO: use the bucket batch add endpoint once it supports non-xet uploads
	const { commit } = await import("./commit");
	await commit({
		repo: { type: "bucket", name: bucketId },
		title: "Copy files (non-xet)",
		operations: files.map((f) => ({
			operation: "addOrUpdate" as const,
			path: f.targetPath,
			content: f.blob,
		})),
		accessToken,
		hubUrl: params.hubUrl,
		fetch: params.fetch,
	});
}

/** Chunk an array into smaller arrays of the given size. */
function* chunkArray<T>(arr: T[], size: number): Generator<T[]> {
	for (let i = 0; i < arr.length; i += size) {
		yield arr.slice(i, i + size);
	}
}

/**
 * Thrown when a copy handle or parameter is invalid.
 */
class CopyHandleError extends Error {}
