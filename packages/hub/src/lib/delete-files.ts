import type { CredentialsParams } from "../types/public.js";
import type { CommitOutput, CommitParams } from "./commit.js";
import { commit } from "./commit.js";

export function deleteFiles(
	params: {
		repo: CommitParams["repo"];
		paths: string[];
		commitTitle?: CommitParams["title"];
		commitDescription?: CommitParams["description"];
		hubUrl?: CommitParams["hubUrl"];
		branch?: CommitParams["branch"];
		isPullRequest?: CommitParams["isPullRequest"];
		parentCommit?: CommitParams["parentCommit"];
		fetch?: CommitParams["fetch"];
	} & CredentialsParams
): Promise<CommitOutput> {
	return commit({
		...(params.accessToken ? { accessToken: params.accessToken } : { credentials: params.credentials }),
		repo: params.repo,
		operations: params.paths.map((path) => ({
			operation: "delete",
			path,
		})),
		title: params.commitTitle ?? `Deletes ${params.paths.length} files`,
		description: params.commitDescription,
		hubUrl: params.hubUrl,
		branch: params.branch,
		isPullRequest: params.isPullRequest,
		parentCommit: params.parentCommit,
		fetch: params.fetch,
	});
}
