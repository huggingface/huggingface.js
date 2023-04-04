import { HUB_URL } from "../consts";
import { createApiError } from "../error";
import type { ApiIndexTreeEntry } from "../types/api/api-index-tree";
import type { Credentials, RepoDesignation } from "../types/public";
import { checkCredentials } from "../utils/checkCredentials";
import { parseLinkHeader } from "../utils/parseLinkHeader";
import { toRepoId } from "../utils/toRepoId";

export interface ListFileEntry {
	type: "file" | "directory" | "unknown";
	size: number;
	path: string;
	oid: string;
	lfs?: {
		oid: string;
		size: number;
		/** Size of the raw pointer file, 100~200 bytes */
		pointerSize: number;
	};
	lastCommit: {
		date: string;
		id: string;
		title: string;
	} | null;
	security?: unknown;
}

/**
 * List files in a folder. To list ALL files in the directory, call it
 * with {@link params.recursive} set to `true`.
 */
export async function* listFiles(params: {
	repo: RepoDesignation;
	/**
	 * Do we want to list files in subdirectories?
	 */
	recursive?: boolean;
	/**
	 * Eg 'data' for listing all files in the 'data' folder. Leave it empty to list all
	 * files in the repo.
	 */
	path?: string;
	revision?: string;
	credentials?: Credentials;
	hubUrl?: string;
}): AsyncGenerator<ListFileEntry> {
	checkCredentials(params.credentials);
	const repoId = toRepoId(params.repo);
	let url: string | undefined = `${params.hubUrl || HUB_URL}/api/${repoId.type}s/${repoId.name}/tree/${
		params.revision || "main"
	}${params.path ? "/" + params.path : ""}${params.recursive ? "?recursive=true" : ""}`;

	while (url) {
		const res: Response = await fetch(url, {
			headers: {
				accept: "application/json",
				...(params.credentials ? { Authorization: `Bearer ${params.credentials.accessToken}` } : undefined),
			},
		});

		if (!res.ok) {
			throw createApiError(res);
		}

		const items: ApiIndexTreeEntry[] = await res.json();

		for (const item of items) {
			yield item;
		}

		const linkHeader = res.headers.get("Link");

		url = linkHeader ? parseLinkHeader(linkHeader).next : undefined;
	}
}
