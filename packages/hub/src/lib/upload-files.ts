import type { CredentialsParams } from "../types/public.js";
import type { CommitOutput, CommitParams, ContentSource } from "./commit.js";
import { commit } from "./commit.js";

export function uploadFiles(
	params: {
		repo: CommitParams["repo"];
		files: Array<URL | File | { path: string; content: ContentSource }>;
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
	} & Partial<CredentialsParams>
): Promise<CommitOutput> {
	return commit({
		...(params.accessToken ? { accessToken: params.accessToken } : { credentials: params.credentials }),
		repo: params.repo,
		operations: params.files.map((file) => ({
			operation: "addOrUpdate",
			path: file instanceof URL ? file.pathname.split("/").at(-1) ?? "file" : "path" in file ? file.path : file.name,
			content: "content" in file ? file.content : file,
		})),
		title: params.commitTitle ?? `Add ${params.files.length} files`,
		description: params.commitDescription,
		hubUrl: params.hubUrl,
		branch: params.branch,
		isPullRequest: params.isPullRequest,
		parentCommit: params.parentCommit,
		fetch: params.fetch,
		useWebWorkers: params.useWebWorkers,
		abortSignal: params.abortSignal,
	});
}
