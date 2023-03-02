import { HUB_URL } from "../consts";
import { createApiError } from "../error";
import type { Credentials, RepoId } from "../types";
import type { ApiIndexTreeEntryData } from "../types/api";
import { parseLinkHeader } from "../utils";

export type ListFileEntry = ApiIndexTreeEntryData;

/**
 * List files in a folder. To list ALL files in the directory, call it
 * with {@link params.recursive} set to `true`.
 */
export async function* listFiles(params: {
	repo:         RepoId;
	/**
	 * Do we want to list files in subdirectories?
	 */
	recursive?:   boolean;
	/**
	 * Eg 'data' for listing all files in the 'data' folder. Leave it empty to list all
	 * files in the repo.
	 */
	path?:        string;
	revision?:    string;
	credentials?: Credentials;
	hubUrl?:      string;
}): AsyncGenerator<ListFileEntry> {
	let url: string | undefined = `${params.hubUrl || HUB_URL}/api/${params.repo.type}s/${params.repo.name}/tree/${
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

		const items: ApiIndexTreeEntryData[] = await res.json();

		for (const item of items) {
			yield item;
		}

		const linkHeader = res.headers.get("Link");

		url = linkHeader ? parseLinkHeader(linkHeader).next : undefined;
	}
}
