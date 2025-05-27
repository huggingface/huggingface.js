import { HUB_URL } from "../consts.js";
import { createApiError } from "../error.js";
import type { CredentialsParams, RepoDesignation } from "../types/public.js";
import { checkCredentials } from "../utils/checkCredentials.js";
import { toRepoId } from "../utils/toRepoId.js";

export async function deleteRepo(
	params: {
		repo: RepoDesignation;
		hubUrl?: string;
		/**
		 * Custom fetch function to use instead of the default one, for example to use a proxy or edit headers.
		 */
		fetch?: typeof fetch;
	} & CredentialsParams
): Promise<void> {
	const accessToken = checkCredentials(params);
	const repoId = toRepoId(params.repo);
	const [namespace, repoName] = repoId.name.split("/");

	const res = await (params.fetch ?? fetch)(`${params.hubUrl ?? HUB_URL}/api/repos/delete`, {
		method: "DELETE",
		body: JSON.stringify({
			name: repoName,
			organization: namespace,
			type: repoId.type,
		}),
		headers: {
			Authorization: `Bearer ${accessToken}`,
			"Content-Type": "application/json",
		},
	});

	if (!res.ok) {
		throw await createApiError(res);
	}
}
