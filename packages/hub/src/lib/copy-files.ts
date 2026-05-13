import type { BucketDesignation, CredentialsParams, RepoDesignation, RepoId } from "../types/public";
import { checkCredentials } from "../utils/checkCredentials";
import { formatBytes } from "../utils/formatBytes";
import { promisesQueue } from "../utils/promisesQueue";
import { toRepoId } from "../utils/toRepoId";
import type { CommitOperation, CommitParams } from "./commit";
import { commit } from "./commit";
import { downloadFile } from "./download-file";
import type { ListFileEntry } from "./list-files";
import { listFiles } from "./list-files";
import type { PathInfo } from "./paths-info";
import { pathsInfo } from "./paths-info";

const DOWNLOAD_CONCURRENCY = 5;
const PATHS_INFO_BATCH_SIZE = 100;
const MAX_REPORTED_LFS_PATHS = 5;

/**
 * One file to copy in a {@link copyFiles} call.
 */
export interface CopyFile {
	source: RepoDesignation;
	sourcePath: string;
	/**
	 * Git revision to read the source from. Ignored for bucket sources.
	 *
	 * @default "main"
	 */
	sourceRevision?: string;
	/**
	 * Exact destination path within the destination bucket.
	 */
	destinationPath: string;
}

type SharedParams = {
	destination: BucketDesignation;
	hubUrl?: CommitParams["hubUrl"];
	fetch?: CommitParams["fetch"];
	abortSignal?: CommitParams["abortSignal"];
} & Partial<CredentialsParams>;

/**
 * Copy a single file from a source repo/bucket to the destination bucket.
 *
 * The copy is server-side (no data transfer) when the source file is xet-backed.
 * For small non-xet repo files (e.g. `config.json`) the file is downloaded and
 * re-uploaded to the destination bucket in the same commit.
 *
 * @example
 * ```ts
 * await copyFile({
 *   source: { type: "model", name: "username/my-model" },
 *   sourcePath: "model.safetensors",
 *   destination: { type: "bucket", name: "username/my-bucket" },
 *   destinationPath: "models/my-model/model.safetensors",
 *   accessToken: "hf_...",
 * });
 * ```
 */
export function copyFile(params: CopyFile & SharedParams): Promise<undefined> {
	return copyFiles({
		...(params.accessToken ? { accessToken: params.accessToken } : { credentials: params.credentials }),
		destination: params.destination,
		files: [
			{
				source: params.source,
				sourcePath: params.sourcePath,
				sourceRevision: params.sourceRevision,
				destinationPath: params.destinationPath,
			},
		],
		hubUrl: params.hubUrl,
		fetch: params.fetch,
		abortSignal: params.abortSignal,
	});
}

/**
 * Copy multiple files (potentially from different source repos/buckets) to the destination
 * bucket in a single commit.
 *
 * For xet-backed source files, the copy is performed server-side with no data transfer.
 * For non-xet source files (typically small git-stored repo files), the file is
 * downloaded and re-uploaded as part of the same commit.
 *
 * @example
 * ```ts
 * await copyFiles({
 *   destination: { type: "bucket", name: "username/my-bucket" },
 *   files: [
 *     {
 *       source: { type: "bucket", name: "username/other-bucket" },
 *       sourcePath: "data.bin",
 *       destinationPath: "data.bin",
 *     },
 *     {
 *       source: { type: "model", name: "username/my-model" },
 *       sourcePath: "model.safetensors",
 *       destinationPath: "models/my-model/model.safetensors",
 *     },
 *   ],
 *   accessToken: "hf_...",
 * });
 * ```
 */
export async function copyFiles(
	params: {
		files: CopyFile[];
	} & SharedParams,
): Promise<undefined> {
	if (params.files.length === 0) {
		return undefined;
	}

	const operations = await resolveCopyOperations(params, params.files);

	await commit({
		...(params.accessToken ? { accessToken: params.accessToken } : { credentials: params.credentials }),
		repo: params.destination,
		operations,
		title: "",
		hubUrl: params.hubUrl,
		fetch: params.fetch,
		abortSignal: params.abortSignal,
	});
	return undefined;
}

/**
 * Copy a folder (recursively) from a source repo/bucket to the destination bucket
 * in a single commit.
 *
 * Per-file paths are resolved relative to {@link sourcePath}; the source folder
 * itself is not preserved in the destination unless {@link destinationPath} keeps it.
 *
 * @example
 * ```ts
 * // Copy an entire dataset under "datasets/my-dataset/" in the bucket
 * await copyFolder({
 *   source: { type: "dataset", name: "username/my-dataset" },
 *   destination: { type: "bucket", name: "username/my-bucket" },
 *   destinationPath: "datasets/my-dataset/",
 *   accessToken: "hf_...",
 * });
 *
 * // Copy a subfolder
 * await copyFolder({
 *   source: { type: "bucket", name: "username/src-bucket" },
 *   sourcePath: "models/",
 *   destination: { type: "bucket", name: "username/dst-bucket" },
 *   destinationPath: "backup/",
 *   accessToken: "hf_...",
 * });
 * ```
 */
export async function copyFolder(
	params: {
		source: RepoDesignation;
		/**
		 * Path of the folder inside the source repo. Leave empty to copy the whole repo.
		 */
		sourcePath?: string;
		/**
		 * Git revision to read the source from. Ignored for bucket sources.
		 *
		 * @default "main"
		 */
		sourceRevision?: string;
		/**
		 * Prefix in the destination bucket where the folder will be copied.
		 * Leave empty to copy under the bucket root.
		 */
		destinationPath?: string;
	} & SharedParams,
): Promise<undefined> {
	const accessToken = checkCredentials(params);
	const sourceRepoId = toRepoId(params.source);
	const sourcePath = (params.sourcePath ?? "").replace(/\/+$/, "");
	const destinationPrefix = (params.destinationPath ?? "").replace(/\/+$/, "");
	const sourceRevision = sourceRepoId.type === "bucket" ? undefined : (params.sourceRevision ?? "main");

	const operations: CommitOperation[] = [];
	const pendingDownloads: Array<{ index: number; sourcePath: string }> = [];
	const lfsOffenders: Array<{ path: string; size: number }> = [];

	for await (const item of listFiles({
		repo: sourceRepoId,
		path: sourcePath || undefined,
		recursive: true,
		revision: sourceRevision,
		accessToken,
		hubUrl: params.hubUrl,
		fetch: params.fetch,
	})) {
		if (item.type !== "file") {
			continue;
		}

		const relPath = relativeUnderFolder(item.path, sourcePath);
		const destPath = destinationPrefix ? `${destinationPrefix}/${relPath}` : relPath;

		switch (classifySourceFile(item)) {
			case "copy":
				operations.push({
					operation: "copy",
					path: destPath,
					sourceXetHash: item.xetHash as string,
					sourceRepo: sourceRepoId,
				});
				continue;
			case "lfs":
				lfsOffenders.push({ path: item.path, size: item.lfs?.size ?? item.size });
				continue;
			case "download":
				// Regular git-stored file (small): download + re-upload in the same commit.
				pendingDownloads.push({ index: operations.length, sourcePath: item.path });
				operations.push({
					operation: "addOrUpdate",
					path: destPath,
					content: new Blob([]),
				});
				continue;
		}
	}

	if (lfsOffenders.length > 0) {
		throwUnmigratedLfsError(sourceRepoId, lfsOffenders);
	}

	if (operations.length === 0) {
		return undefined;
	}

	if (pendingDownloads.length > 0) {
		await downloadAndFillBlobs({
			pendingDownloads,
			operations,
			sourceRepoId,
			sourceRevision,
			accessToken,
			hubUrl: params.hubUrl,
			fetch: params.fetch,
		});
	}

	await commit({
		...(params.accessToken ? { accessToken: params.accessToken } : { credentials: params.credentials }),
		repo: params.destination,
		operations,
		title: "",
		hubUrl: params.hubUrl,
		fetch: params.fetch,
		abortSignal: params.abortSignal,
	});
	return undefined;
}

/**
 * Resolve a list of {@link CopyFile} entries into `CommitOperation`s, batching `pathsInfo`
 * calls per source repo and parallelizing downloads for non-xet files.
 */
async function resolveCopyOperations(shared: SharedParams, files: CopyFile[]): Promise<CommitOperation[]> {
	const accessToken = checkCredentials(shared);

	// Group files by (source repo, source revision) so we can batch pathsInfo calls.
	const groups = new Map<
		string,
		{
			repoId: RepoId;
			revision: string | undefined;
			entries: Array<{ index: number; file: CopyFile }>;
		}
	>();

	for (let i = 0; i < files.length; i++) {
		const file = files[i];
		const repoId = toRepoId(file.source);
		const revision = repoId.type === "bucket" ? undefined : (file.sourceRevision ?? "main");
		const key = `${repoId.type}\0${repoId.name}\0${revision ?? ""}`;

		let group = groups.get(key);
		if (!group) {
			group = { repoId, revision, entries: [] };
			groups.set(key, group);
		}
		group.entries.push({ index: i, file });
	}

	const operations: CommitOperation[] = new Array(files.length);
	const pendingDownloads: Array<{ index: number; repoId: RepoId; revision: string | undefined; sourcePath: string }> =
		[];

	for (const group of groups.values()) {
		const paths = group.entries.map((e) => e.file.sourcePath);

		const infos: Awaited<ReturnType<typeof pathsInfo>> = [];
		for (let offset = 0; offset < paths.length; offset += PATHS_INFO_BATCH_SIZE) {
			const slice = paths.slice(offset, offset + PATHS_INFO_BATCH_SIZE);
			const res = await pathsInfo({
				repo: group.repoId,
				paths: slice,
				revision: group.revision,
				accessToken,
				hubUrl: shared.hubUrl,
				fetch: shared.fetch,
			});
			infos.push(...res);
		}

		const infoByPath = new Map(infos.map((i) => [i.path, i]));
		const lfsOffenders: Array<{ path: string; size: number }> = [];

		for (const { index, file } of group.entries) {
			const info = infoByPath.get(file.sourcePath);
			if (!info) {
				throw new Error(`Source file not found: '${file.sourcePath}' in ${group.repoId.type}s/${group.repoId.name}`);
			}
			if (info.type !== "file") {
				throw new Error(
					`Source path '${file.sourcePath}' in ${group.repoId.type}s/${group.repoId.name} is a folder; use copyFolder() instead.`,
				);
			}

			switch (classifySourceFile(info)) {
				case "copy":
					operations[index] = {
						operation: "copy",
						path: file.destinationPath,
						sourceXetHash: info.xetHash as string,
						sourceRepo: group.repoId,
					};
					continue;
				case "lfs":
					lfsOffenders.push({ path: file.sourcePath, size: info.lfs?.size ?? info.size });
					continue;
				case "download":
					pendingDownloads.push({
						index,
						repoId: group.repoId,
						revision: group.revision,
						sourcePath: file.sourcePath,
					});
					operations[index] = {
						operation: "addOrUpdate",
						path: file.destinationPath,
						content: new Blob([]),
					};
					continue;
			}
		}

		if (lfsOffenders.length > 0) {
			throwUnmigratedLfsError(group.repoId, lfsOffenders);
		}
	}

	if (pendingDownloads.length > 0) {
		await promisesQueue(
			pendingDownloads.map(({ index, repoId, revision, sourcePath }) => async () => {
				const blob = await downloadFile({
					repo: repoId,
					path: sourcePath,
					revision,
					accessToken,
					hubUrl: shared.hubUrl,
					fetch: shared.fetch,
				});
				if (!blob) {
					throw new Error(`Failed to download '${sourcePath}' from ${repoId.type}s/${repoId.name}`);
				}
				const op = operations[index];
				if (op.operation !== "addOrUpdate") {
					throw new Error("Internal: expected addOrUpdate placeholder operation");
				}
				op.content = blob;
			}),
			DOWNLOAD_CONCURRENCY,
		);
	}

	return operations;
}

async function downloadAndFillBlobs(args: {
	pendingDownloads: Array<{ index: number; sourcePath: string }>;
	operations: CommitOperation[];
	sourceRepoId: RepoId;
	sourceRevision: string | undefined;
	accessToken: string | undefined;
	hubUrl: string | undefined;
	fetch: typeof fetch | undefined;
}): Promise<void> {
	await promisesQueue(
		args.pendingDownloads.map(({ index, sourcePath }) => async () => {
			const blob = await downloadFile({
				repo: args.sourceRepoId,
				path: sourcePath,
				revision: args.sourceRevision,
				accessToken: args.accessToken,
				hubUrl: args.hubUrl,
				fetch: args.fetch,
			});
			if (!blob) {
				throw new Error(`Failed to download '${sourcePath}' from ${args.sourceRepoId.type}s/${args.sourceRepoId.name}`);
			}
			const op = args.operations[index];
			if (op.operation !== "addOrUpdate") {
				throw new Error("Internal: expected addOrUpdate placeholder operation");
			}
			op.content = blob;
		}),
		DOWNLOAD_CONCURRENCY,
	);
}

/**
 * Compute the path of `filePath` relative to `folderPath`. Used to map source paths
 * under a folder being copied to destination paths under the new prefix.
 */
export function relativeUnderFolder(filePath: string, folderPath: string): string {
	if (!folderPath) {
		return filePath;
	}
	if (filePath === folderPath) {
		return filePath.split("/").pop() ?? filePath;
	}
	if (filePath.startsWith(folderPath + "/")) {
		return filePath.slice(folderPath.length + 1);
	}
	throw new Error(`Path '${filePath}' is not inside folder '${folderPath}'`);
}

/**
 * Decide how to handle a source file in the copy pipeline:
 * - `"copy"`: xet-backed, can be copied server-side.
 * - `"download"`: regular git-stored file, safe to download + re-upload.
 * - `"lfs"`: LFS pointer file that has not been migrated to xet. We refuse to copy these
 *   because they can be arbitrarily large; the caller should migrate them to xet first.
 */
function classifySourceFile(file: ListFileEntry | PathInfo): "copy" | "download" | "lfs" {
	if (file.xetHash) {
		return "copy";
	}
	if (file.lfs) {
		return "lfs";
	}
	return "download";
}

function throwUnmigratedLfsError(repoId: RepoId, entries: Array<{ path: string; size: number }>): never {
	const head = entries
		.slice(0, MAX_REPORTED_LFS_PATHS)
		.map((e) => `'${e.path}' (${formatBytes(e.size)})`)
		.join(", ");
	const more = entries.length > MAX_REPORTED_LFS_PATHS ? ` (and ${entries.length - MAX_REPORTED_LFS_PATHS} more)` : "";
	throw new Error(
		`Cannot copy ${entries.length} LFS file(s) from ${repoId.type}s/${repoId.name} that have not been migrated to xet: ${head}${more}. ` +
			`Migrate these files to xet before copying.`,
	);
}
