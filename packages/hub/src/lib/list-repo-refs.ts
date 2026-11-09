import { HUB_URL } from "../consts";
import { createApiError } from "../error";
import type { AccessToken, RepoDesignation } from "../types/public";
import { toRepoId } from "../utils/toRepoId";
import { fetchWithServerWarnings } from "../utils/serverWarnings";

export interface GitRefInfo {
	name: string;
	ref: string;
	targetCommit: string;
}

export interface GitRefs {
	branches: GitRefInfo[];
	converts: GitRefInfo[];
	tags: GitRefInfo[];
	pullRequests?: GitRefInfo[];
}

export async function listRepoRefs(params: {
	repo: RepoDesignation;
	/**
	 * Whether to also list the refs of pull requests. Defaults to false.
	 */
	includePullRequests?: boolean;
	hubUrl?: string;
	accessToken?: AccessToken;
	fetch?: typeof fetch;
}): Promise<GitRefs> {
	const repoId = toRepoId(params.repo);
	const res = await fetchWithServerWarnings(params.fetch)(
		`${params.hubUrl ?? HUB_URL}/api/${repoId.type}s/${repoId.name}/refs${
			params.includePullRequests ? "?include_prs=1" : ""
		}`,
		{
			headers: {
				...(params.accessToken && {
					Authorization: `Bearer ${params.accessToken}`,
				}),
			},
		},
	);

	if (!res.ok) {
		throw await createApiError(res);
	}

	return (await res.json()) as GitRefs;
}
