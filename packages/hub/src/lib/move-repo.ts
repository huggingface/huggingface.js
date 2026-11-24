import { HUB_URL } from "../consts";
import { createApiError } from "../error";
import type { AccessToken, RepoDesignation } from "../types/public";
import { toRepoId } from "../utils/toRepoId";
import { fetchWithServerWarnings } from "../utils/serverWarnings";

export async function moveRepo(params: {
	/**
	 * The repo to move (rename or transfer to another namespace)
	 */
	fromRepo: RepoDesignation;
	/**
	 * The destination of the repo. Must be of the same repo type as `fromRepo`.
	 */
	toRepo: RepoDesignation;
	hubUrl?: string;
	accessToken?: AccessToken;
	fetch?: typeof fetch;
}): Promise<void> {
	const fromId = toRepoId(params.fromRepo);
	const toId = toRepoId(params.toRepo);

	if (fromId.type !== toId.type) {
		throw new TypeError(`Cannot move a ${fromId.type} to a ${toId.type}: fromRepo and toRepo must have the same type`);
	}

	const res = await fetchWithServerWarnings(params.fetch)(`${params.hubUrl ?? HUB_URL}/api/repos/move`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			...(params.accessToken && {
				Authorization: `Bearer ${params.accessToken}`,
			}),
		},
		body: JSON.stringify({
			fromRepo: fromId.name,
			toRepo: toId.name,
			type: fromId.type,
		}),
	});

	if (!res.ok) {
		throw await createApiError(res);
	}
}
