import type { CredentialsParams } from "../types/public";
import type { CommitOperation, CommitOutput, CommitParams, ContentSource } from "./commit";
import { commit } from "./commit";

/**
 * Edit an existing file by replacing byte ranges of its original content, without
 * re-uploading the whole file.
 *
 * When `originalContent` comes from {@link downloadFile} on a xet-backed file, the
 * unchanged parts are neither downloaded nor re-uploaded: only the modified byte ranges
 * (and their chunk-boundary neighborhood) are transferred. This works fully remotely —
 * without downloading the unchanged data at all — when uploading to a bucket.
 *
 * @example
 * const original = await downloadFile({ repo: "buckets/me/repo", path: "model.gguf" });
 * await uploadFile({
 *   repo: "buckets/me/repo",
 *   file: {
 *     path: "model.gguf",
 *     originalContent: original,
 *     edits: [{ start: 0, end: 100, content: new Blob([patchedHeader]) }],
 *   },
 * });
 */
export interface CommitEditFileParams {
	path: string;
	/** The file's current content, eg as returned by {@link downloadFile} */
	originalContent: Blob;
	edits: Array<{
		/** `originalContent` from [start, end) will be replaced by this */
		content: Blob;
		/** The start position of the edit in the original content */
		start: number;
		/** The end position of the edit in the original content */
		end: number;
	}>;
}

export function uploadFile(
	params: {
		repo: CommitParams["repo"];
		file: URL | File | { path: string; content: ContentSource } | CommitEditFileParams;
		commitTitle?: CommitParams["title"];
		commitDescription?: CommitParams["description"];
		hubUrl?: CommitParams["hubUrl"];
		branch?: CommitParams["branch"];
		isPullRequest?: CommitParams["isPullRequest"];
		parentCommit?: CommitParams["parentCommit"];
		fetch?: CommitParams["fetch"];
		useWebWorkers?: CommitParams["useWebWorkers"];
		abortSignal?: CommitParams["abortSignal"];
		useXet?: CommitParams["useXet"];
		rangeEditCache?: CommitParams["rangeEditCache"];
	} & Partial<CredentialsParams>,
): Promise<CommitOutput | undefined> {
	const path =
		params.file instanceof URL
			? (params.file.pathname.split("/").at(-1) ?? "file")
			: "path" in params.file
				? params.file.path
				: params.file.name;

	const operation: CommitOperation =
		typeof params.file === "object" && "edits" in params.file
			? {
					operation: "edit",
					path,
					originalContent: params.file.originalContent,
					edits: params.file.edits,
				}
			: {
					operation: "addOrUpdate",
					path,
					content: "content" in params.file ? params.file.content : params.file,
				};

	return commit({
		...(params.accessToken ? { accessToken: params.accessToken } : { credentials: params.credentials }),
		repo: params.repo,
		operations: [operation],
		title: params.commitTitle ?? `${operation.operation === "edit" ? "Edit" : "Add"} ${path}`,
		description: params.commitDescription,
		hubUrl: params.hubUrl,
		branch: params.branch,
		isPullRequest: params.isPullRequest,
		parentCommit: params.parentCommit,
		fetch: params.fetch,
		useWebWorkers: params.useWebWorkers,
		abortSignal: params.abortSignal,
		useXet: params.useXet,
		rangeEditCache: params.rangeEditCache,
	});
}
