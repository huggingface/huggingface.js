import { HUB_URL } from "../consts";
import { createApiError } from "../error";
import type { AccessToken, RepoDesignation } from "../types/public";
import { toRepoId } from "../utils/toRepoId";
import { fetchWithServerWarnings } from "../utils/serverWarnings";

export async function createTag(params: {
	repo: RepoDesignation;
	/**
	 * The name of the tag to create
	 */
	tag: string;
	/**
	 * An optional message describing the tag
	 */
	tagMessage?: string;
	/**
	 * The git revision to tag. It can be a branch name or the OID/SHA of a commit.
	 *
	 * Defaults to the head of the `"main"` branch.
	 */
	revision?: string;
	hubUrl?: string;
	accessToken?: AccessToken;
	fetch?: typeof fetch;
}): Promise<void> {
	const repoId = toRepoId(params.repo);
	const res = await fetchWithServerWarnings(params.fetch)(
		`${params.hubUrl ?? HUB_URL}/api/${repoId.type}s/${repoId.name}/tag/${encodeURIComponent(
			params.revision ?? "main",
		)}`,
		{
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				...(params.accessToken && {
					Authorization: `Bearer ${params.accessToken}`,
				}),
			},
			body: JSON.stringify({
				tag: params.tag,
				...(params.tagMessage && { message: params.tagMessage }),
			}),
		},
	);

	if (!res.ok) {
		throw await createApiError(res);
	}
}
