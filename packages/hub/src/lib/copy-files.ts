import { HUB_URL } from "../consts";
import { createApiError } from "../error";
import type { ApiBucketBatchResponse } from "../types/api/api-commit";
import type { CredentialsParams, RepoType } from "../types/public";
import { checkCredentials } from "../utils/checkCredentials";
import { chunk } from "../utils/chunk";
import { downloadFile } from "./download-file";
import type { ListFileEntry } from "./list-files";
import { listFiles } from "./list-files";
import type { PathInfo } from "./paths-info";
import { pathsInfo } from "./paths-info";
import { commit } from "./commit";

const BATCH_CHUNK_SIZE = 1000;

interface BucketCopyHandle {
	type: "bucket";
	bucketId: string;
	path: string;
}

interface RepoCopyHandle {
	type: "repo";
	repoType: RepoType;
	repoId: string;
	revision: string;
	path: string;
}

type CopyHandle = BucketCopyHandle | RepoCopyHandle;

/**
 * Parse an `hf://` handle into a structured representation.
 *
 * Supports:
 * - `hf://buckets/namespace/bucket-name/optional/path`
 * - `hf://models/namespace/repo-name/path`  (or `hf://namespace/repo-name/path` defaults to model)
 * - `hf://datasets/namespace/repo-name/path`
 * - `hf://spaces/namespace/repo-name/path`
 * - Revisions via `@revision`: `hf://namespace/repo-name@rev/path`
 */
export function parseHfCopyHandle(hfHandle: string): CopyHandle {
	if (!hfHandle.startsWith("hf://")) {
		throw new Error(`Invalid HF handle: '${hfHandle}'. Expected a path starting with 'hf://'.`);
	}

	const path = hfHandle.slice("hf://".length);

	if (path.startsWith("buckets/")) {
		const rest = path.slice("buckets/".length);
		const parts = rest.split("/");
		if (parts.length < 2 || !parts[0] || !parts[1]) {
			throw new Error(`Invalid bucket path: '${hfHandle}'. Expected format: hf://buckets/namespace/bucket_name`);
		}
		const bucketId = `${parts[0]}/${parts[1]}`;
		const bucketPath = parts.slice(2).join("/");
		return {
			type: "bucket",
			bucketId,
			path: bucketPath,
		};
	}

	const trimmed = path.replace(/^\/+|\/+$/g, "");
	if (!trimmed) {
		throw new Error(`Invalid HF handle: '${hfHandle}'.`);
	}

	const parts = trimmed.split("/");

	const repoTypeMapping: Record<string, RepoType> = {
		models: "model",
		datasets: "dataset",
		spaces: "space",
	};

	let repoType: RepoType = "model";
	let restParts = parts;
	if (parts[0] in repoTypeMapping) {
		repoType = repoTypeMapping[parts[0]];
		restParts = parts.slice(1);
	}

	if (restParts.length < 2) {
		throw new Error(
			`Invalid repo HF handle: '${hfHandle}'. Expected format 'hf://namespace/repo/path' or with explicit repo type prefix.`,
		);
	}

	const namespace = restParts[0];
	const repoNameWithRevision = restParts[1];
	const remainingParts = restParts.slice(2);

	let repoName: string;
	let revision: string;

	if (repoNameWithRevision.includes("@")) {
		const atIdx = repoNameWithRevision.indexOf("@");
		repoName = repoNameWithRevision.slice(0, atIdx);
		revision = decodeURIComponent(repoNameWithRevision.slice(atIdx + 1));
	} else {
		repoName = repoNameWithRevision;
		revision = "main";
	}

	const repoPath = remainingParts.join("/");

	return {
		type: "repo",
		repoType,
		repoId: `${namespace}/${repoName}`,
		revision,
		path: repoPath,
	};
}

interface CopyFileOp {
	path: string;
	xetHash: string;
	sourceRepoType: string;
	sourceRepoId: string;
}

/**
 * Copy files between locations on the Hub.
 *
 * Copies files from a bucket or repository (model, dataset, space) to a bucket.
 * Both individual files and entire folders are supported.
 *
 * Currently, only bucket destinations are supported. Copying to a repository is not supported.
 *
 * For xet-backed files (most files on the Hub), the copy is performed server-side
 * with no data transfer. For small non-xet files in repositories, the files are
 * downloaded and re-uploaded to the destination bucket.
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
 * // Copy from a model repo to a bucket
 * await copyFiles({
 *   source: "hf://models/username/my-model/model.safetensors",
 *   destination: "hf://buckets/my-bucket/",
 *   accessToken: "hf_...",
 * });
 *
 * // Copy an entire dataset to a bucket
 * await copyFiles({
 *   source: "hf://datasets/username/my-dataset/",
 *   destination: "hf://buckets/my-bucket/datasets/",
 *   accessToken: "hf_...",
 * });
 * ```
 */
export async function copyFiles(
	params: {
		/**
		 * Source location as an `hf://` handle.
		 * Can be a bucket path (e.g. `"hf://buckets/my-bucket/path/to/file"`)
		 * or a repo path (e.g. `"hf://models/username/my-model/weights.bin"`,
		 * `"hf://datasets/username/my-dataset/data/"`).
		 */
		source: string;
		/**
		 * Destination location as an `hf://` handle pointing to a bucket
		 * (e.g. `"hf://buckets/my-bucket/target/path"`).
		 */
		destination: string;
		hubUrl?: string;
		/**
		 * Custom fetch function to use instead of the default one, for example to use a proxy or edit headers.
		 */
		fetch?: typeof fetch;
	} & Partial<CredentialsParams>,
): Promise<void> {
	const accessToken = checkCredentials(params);
	const hubUrl = params.hubUrl ?? HUB_URL;
	const fetchFn = params.fetch ?? fetch;

	const sourceHandle = parseHfCopyHandle(params.source);
	const destinationHandle = parseHfCopyHandle(params.destination);

	if (destinationHandle.type !== "bucket") {
		throw new Error("Bucket-to-repo and repo-to-repo copy are not supported. Destination must be a bucket.");
	}

	const destinationBucketId = destinationHandle.bucketId;
	const destinationPath = destinationHandle.path;

	let destinationIsDirectory: boolean;
	if (destinationPath === "" || params.destination.endsWith("/")) {
		destinationIsDirectory = true;
	} else {
		const destInfo = await pathsInfo({
			repo: { type: "bucket", name: destinationBucketId },
			paths: [destinationPath],
			accessToken,
			hubUrl,
			fetch: fetchFn,
		});

		if (destInfo.length > 0) {
			destinationIsDirectory = false;
		} else {
			let hasChildren = false;
			for await (const _ of listFiles({
				repo: { type: "bucket", name: destinationBucketId },
				path: destinationPath,
				recursive: false,
				accessToken,
				hubUrl,
				fetch: fetchFn,
			})) {
				hasChildren = true;
				break;
			}
			destinationIsDirectory = hasChildren;
		}
	}

	function resolveTargetPath(srcFilePath: string, srcRootPath: string | null, isSingleFile: boolean): string {
		const basename = srcFilePath.split("/").pop() ?? srcFilePath;
		if (isSingleFile) {
			if (destinationPath === "") {
				return basename;
			}
			if (destinationIsDirectory) {
				return `${destinationPath.replace(/\/+$/, "")}/${basename}`;
			}
			return destinationPath;
		}

		let relPath: string;
		if (srcRootPath === null) {
			relPath = srcFilePath;
		} else if (srcFilePath.startsWith(srcRootPath + "/")) {
			relPath = srcFilePath.slice(srcRootPath.length + 1);
		} else if (srcFilePath === srcRootPath) {
			relPath = srcFilePath.split("/").pop() ?? srcFilePath;
		} else {
			throw new Error(`Unexpected source path while copying folder: '${srcFilePath}'.`);
		}

		if (relPath === "") {
			throw new Error("Cannot copy an empty relative path.");
		}
		if (destinationPath === "") {
			return relPath;
		}
		return `${destinationPath.replace(/\/+$/, "")}/${relPath}`;
	}

	const allCopies: CopyFileOp[] = [];
	const pendingDownloads: Array<{ filePath: string; targetPath: string }> = [];

	if (sourceHandle.type === "bucket") {
		const sourcePath = sourceHandle.path;

		let sourcePathInfo: PathInfo[] = [];
		if (sourcePath) {
			sourcePathInfo = await pathsInfo({
				repo: { type: "bucket", name: sourceHandle.bucketId },
				paths: [sourcePath],
				accessToken,
				hubUrl,
				fetch: fetchFn,
			});
		}

		if (sourcePathInfo.length === 1 && sourcePathInfo[0].type === "file") {
			const sourceFile = sourcePathInfo[0];
			const targetPath = resolveTargetPath(sourceFile.path, null, true);
			allCopies.push({
				path: targetPath,
				xetHash: sourceFile.xetHash!,
				sourceRepoType: "bucket",
				sourceRepoId: sourceHandle.bucketId,
			});
		} else {
			destinationIsDirectory = true;
			for await (const item of listFiles({
				repo: { type: "bucket", name: sourceHandle.bucketId },
				path: sourcePath || undefined,
				recursive: true,
				accessToken,
				hubUrl,
				fetch: fetchFn,
			})) {
				if (item.type !== "file") {
					continue;
				}
				if (sourcePath && !(item.path === sourcePath || item.path.startsWith(sourcePath + "/"))) {
					continue;
				}
				const targetPath = resolveTargetPath(item.path, sourcePath || null, false);
				allCopies.push({
					path: targetPath,
					xetHash: item.xetHash!,
					sourceRepoType: "bucket",
					sourceRepoId: sourceHandle.bucketId,
				});
			}
		}
	} else {
		const sourcePath = sourceHandle.path;
		const repoDesignation = { type: sourceHandle.repoType, name: sourceHandle.repoId } as const;

		function addRepoFile(file: ListFileEntry | PathInfo, targetPath: string): void {
			if (file.xetHash && sourceHandle.type === "repo") {
				allCopies.push({
					path: targetPath,
					xetHash: file.xetHash,
					sourceRepoType: sourceHandle.repoType,
					sourceRepoId: sourceHandle.repoId,
				});
			} else {
				pendingDownloads.push({ filePath: file.path, targetPath });
			}
		}

		let sourceRepoPathInfo: PathInfo[] = [];
		if (sourcePath !== "") {
			sourceRepoPathInfo = await pathsInfo({
				repo: repoDesignation,
				paths: [sourcePath],
				revision: sourceHandle.revision,
				accessToken,
				hubUrl,
				fetch: fetchFn,
			});
		}

		if (sourceRepoPathInfo.length === 1 && sourceRepoPathInfo[0].type === "file") {
			const targetPath = resolveTargetPath(sourceRepoPathInfo[0].path, null, true);
			addRepoFile(sourceRepoPathInfo[0], targetPath);
		} else {
			destinationIsDirectory = true;
			for await (const repoItem of listFiles({
				repo: repoDesignation,
				path: sourcePath || undefined,
				recursive: true,
				revision: sourceHandle.revision,
				accessToken,
				hubUrl,
				fetch: fetchFn,
			})) {
				if (repoItem.type !== "file") {
					continue;
				}
				const targetPath = resolveTargetPath(repoItem.path, sourcePath || null, false);
				addRepoFile(repoItem, targetPath);
			}
		}
	}

	// Download non-xet files from repos and re-upload them to the destination bucket.
	// These are typically small git-stored files (config.json, tokenizer files, etc.).
	if (pendingDownloads.length > 0 && sourceHandle.type === "repo") {
		const repoDesignation = { type: sourceHandle.repoType, name: sourceHandle.repoId } as const;
		const bucketDesignation = { type: "bucket" as const, name: destinationBucketId };

		for (const { filePath, targetPath } of pendingDownloads) {
			const blob = await downloadFile({
				repo: repoDesignation,
				path: filePath,
				revision: sourceHandle.revision,
				accessToken,
				hubUrl,
				fetch: fetchFn,
			});
			if (!blob) {
				throw new Error(`Failed to download file '${filePath}' from repo '${sourceHandle.repoId}'.`);
			}
			await commit({
				repo: bucketDesignation,
				operations: [
					{
						operation: "addOrUpdate",
						path: targetPath,
						content: blob,
					},
				],
				title: `Copy ${filePath}`,
				accessToken,
				hubUrl,
				fetch: fetchFn,
			});
		}
	}

	// Send server-side copy operations in batches
	for (const copyChunk of chunk(allCopies, BATCH_CHUNK_SIZE)) {
		const ndjsonBody = copyChunk
			.map((op) =>
				JSON.stringify({
					type: "copyFile",
					path: op.path,
					xetHash: op.xetHash,
					sourceRepoType: op.sourceRepoType,
					sourceRepoId: op.sourceRepoId,
				}),
			)
			.join("\n");

		const resp = await fetchFn(`${hubUrl}/api/buckets/${destinationBucketId}/batch`, {
			method: "POST",
			headers: {
				...(accessToken && { Authorization: `Bearer ${accessToken}` }),
				"Content-Type": "application/x-ndjson",
			},
			body: ndjsonBody,
		});

		if (!resp.ok) {
			throw await createApiError(resp);
		}

		const result = (await resp.json()) as ApiBucketBatchResponse;
		if (result.failed.length > 0) {
			const failedPaths = result.failed
				.slice(0, 5)
				.map((f) => `${f.path}: ${f.error}`)
				.join(", ");
			throw new Error(
				`Failed to copy ${result.failed.length} file(s): ${failedPaths}${result.failed.length > 5 ? "..." : ""}`,
			);
		}
	}
}
