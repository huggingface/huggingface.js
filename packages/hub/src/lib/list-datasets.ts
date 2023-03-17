import { URLSearchParams } from "url";
import { HUB_URL } from "../consts";
import { createApiError } from "../error";
import type { ApiDatasetInfo } from "../types/api/api-dataset";
import type { Credentials } from "../types/public";
import { checkCredentials } from "../utils/checkCredentials";
import { parseLinkHeader } from "../utils/parseLinkHeader";

export interface DatasetEntry {
	id: string;
	name: string;
	private: boolean;
	downloads: number;
}

export async function* listDatasets(params?: {
	search?: {
		owner?: string;
	};
	credentials?: Credentials;
	hubUrl?: string;
}): AsyncGenerator<DatasetEntry> {
	checkCredentials(params?.credentials);
	const search = new URLSearchParams({
		...(params?.search?.owner ? { author: params.search.owner } : undefined),
	}).toString();
	let url: string | undefined = `${params?.hubUrl || HUB_URL}/api/datasets` + (search ? "?" + search : "");

	while (url) {
		const res: Response = await fetch(url, {
			headers: {
				accept: "application/json",
				...(params?.credentials ? { Authorization: `Bearer ${params.credentials.accessToken}` } : undefined),
			},
		});

		if (!res.ok) {
			throw createApiError(res);
		}

		const items: ApiDatasetInfo[] = await res.json();

		for (const item of items) {
			yield {
				id: item._id,
				name: item.id,
				private: item.private,
				downloads: item.downloads,
			};
		}

		const linkHeader = res.headers.get("Link");

		url = linkHeader ? parseLinkHeader(linkHeader).next : undefined;
	}
}
