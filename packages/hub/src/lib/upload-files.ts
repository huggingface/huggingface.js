import type { CredentialsParams } from "../types/public";
import type { CommitOperation, CommitOutput, CommitParams, ContentSource } from "./commit";
import { commit } from "./commit";
import type { CommitEditFileParams } from "./upload-file";

export function uploadFiles(
	params: {
		repo: CommitParams["repo"];
		files: Array<URL | File | { path: string; content: ContentSource } | CommitEditFileParams>;
		commitTitle?: CommitParams["title"];
		commitDescription?: CommitParams["description"];
		hubUrl?: CommitParams["hubUrl"];
		branch?: CommitParams["branch"];
		isPullRequest?: CommitParams["isPullRequest"];
		parentCommit?: CommitParams["parentCommit"];
		fetch?: CommitParams["fetch"];
		useWebWorkers?: CommitParams["useWebWorkers"];
		maxFolderDepth?: CommitParams["maxFolderDepth"];
		abortSignal?: CommitParams["abortSignal"];
		useXet?: CommitParams["useXet"];
		rangeEditCache?: CommitParams["rangeEditCache"];
	} & Partial<CredentialsParams>,
): Promise<CommitOutput | undefined> {
	const operations: CommitOperation[] = params.files.map((file) => {
		const path =
			file instanceof URL ? (file.pathname.split("/").at(-1) ?? "file") : "path" in file ? file.path : file.name;

		if (typeof file === "object" && "edits" in file) {
			return {
				operation: "edit",
				path,
				originalContent: file.originalContent,
				edits: file.edits,
			};
		}
		return {
			operation: "addOrUpdate",
			path,
			content: "content" in file ? file.content : file,
		};
	});

	return commit({
		...(params.accessToken ? { accessToken: params.accessToken } : { credentials: params.credentials }),
		repo: params.repo,
		operations,
		title: params.commitTitle ?? `Add ${params.files.length} files`,
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
