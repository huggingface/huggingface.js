import { HUB_URL } from "../consts";
import { createApiError } from "../error";
import type { AccessToken, RepoDesignation } from "../types/public";
import { toRepoId } from "../utils/toRepoId";
import { fetchWithServerWarnings } from "../utils/serverWarnings";

export interface DuplicatedRepo {
	/**
	 * URL of the duplicated repo on the Hub.
	 */
	url: string;
	/**
	 * When duplicating a repo with many (or large) LFS files, the copy of those files happens
	 * asynchronously after the call returns. In that case `filesCopyPending` is `true` and
	 * downloading those files immediately can fail.
	 */
	filesCopyPending: boolean;
}

export async function duplicateRepo(params: {
	/**
	 * The repo to duplicate.
	 */
	fromRepo: RepoDesignation;
	/**
	 * The destination of the duplicated repo. Must be of the same repo type as `fromRepo`.
	 *
	 * Defaults to the source repo's name in the caller's own namespace.
	 */
	toRepo?: RepoDesignation;
	/**
	 * Whether the duplicated repo should be private. Defaults to the same visibility as the
	 * original repo.
	 */
	private?: boolean;
	hubUrl?: string;
	accessToken: AccessToken;
	fetch?: typeof fetch;
}): Promise<DuplicatedRepo> {
	const fromId = toRepoId(params.fromRepo);
	const toId = params.toRepo ? toRepoId(params.toRepo) : undefined;

	if (toId && fromId.type !== toId.type) {
		throw new TypeError(
			`Cannot duplicate a ${fromId.type} into a ${toId.type}: fromRepo and toRepo must have the same type`,
		);
	}

	const destination = toId ? toId.name : (fromId.name.split("/").pop() ?? fromId.name);

	const res = await fetchWithServerWarnings(params.fetch)(
		`${params.hubUrl ?? HUB_URL}/api/${fromId.type}s/${fromId.name}/duplicate`,
		{
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${params.accessToken}`,
			},
			body: JSON.stringify({
				repository: destination,
				...(params.private !== undefined && { private: params.private }),
			}),
		},
	);

	if (!res.ok) {
		throw await createApiError(res);
	}

	const data = (await res.json()) as { url: string; filesCopyPending?: boolean };
	return {
		url: data.url,
		filesCopyPending: data.filesCopyPending ?? false,
	};
}
