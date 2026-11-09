import { HUB_URL } from "../consts";
import { createApiError } from "../error";
import type { AccessToken, RepoDesignation } from "../types/public";
import { toRepoId } from "../utils/toRepoId";
import { fetchWithServerWarnings } from "../utils/serverWarnings";

export async function superSquashHistory(params: {
	repo: RepoDesignation;
	/**
	 * The branch to squash. Defaults to the head of the `"main"` branch.
	 *
	 * Squashing commits can only be performed from the head of a branch. Once the history of a
	 * branch has been squashed, it is not possible to merge it back into another branch.
	 */
	branch?: string;
	/**
	 * The commit message to use for the squashed commit.
	 */
	commitMessage?: string;
	hubUrl?: string;
	accessToken?: AccessToken;
	fetch?: typeof fetch;
}): Promise<void> {
	const repoId = toRepoId(params.repo);
	const branch = params.branch ?? "main";
	const res = await fetchWithServerWarnings(params.fetch)(
		`${params.hubUrl ?? HUB_URL}/api/${repoId.type}s/${repoId.name}/super-squash/${encodeURIComponent(branch)}`,
		{
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				...(params.accessToken && {
					Authorization: `Bearer ${params.accessToken}`,
				}),
			},
			body: JSON.stringify({
				message: params.commitMessage ?? `Super-squash branch '${branch}' using @huggingface/hub`,
			}),
		},
	);

	if (!res.ok) {
		throw await createApiError(res);
	}
}
