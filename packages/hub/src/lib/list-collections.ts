import { HUB_URL } from "../consts";
import { createApiError } from "../error";
import type { ApiCollectionInfo } from "../types/api/api-collection";
import type { Credentials } from "../types/public";
import { checkCredentials } from "../utils/checkCredentials";
import type { CollectionEntry } from "./get-collection";
import { parseLinkHeader } from "../utils/parseLinkHeader";

export enum CollectionSortMethod {
	LastModified = "lastModified",
	Trending = "trending",
	Upvotes = "upvotes",
}

export async function* listCollections(params: {
	search?: {
		owner?: string[] | string;
		item?: string[] | string;
		sort?: CollectionSortMethod;
		q?: string;
	};
	//
	credentials?: Credentials;
	hubUrl?: string;
	/**
	 * Custom fetch function to use instead of the default one, for example to use a proxy or edit headers.
	 */
	fetch?: typeof fetch;
	additionalFields?: Array<keyof ApiCollectionInfo>;
}): AsyncGenerator<CollectionEntry> {
	checkCredentials(params.credentials);

	const paramToFlatArr = (name: string, value: string | string[]): [string, string][] => {
		return Array.isArray(value) ? value.map((val: string) => [name, val]) : [[name, value]];
	};
	const flatSearchParams = Object.entries(params.search || {}).reduce(
		(acc, item) => [...acc, ...paramToFlatArr(item[0], item[1])],
		[] as [string, string][]
	);

	const query = new URLSearchParams([["limit", "100"], ...flatSearchParams]).toString();
	let url: string | undefined = `${params?.hubUrl || HUB_URL}/api/collections?${query}`;

	while (url) {
		const res: Response = await (params.fetch ?? fetch)(url, {
			headers: {
				accept: "application/json",
				...(params?.credentials ? { Authorization: `Bearer ${params.credentials.accessToken}` } : undefined),
			},
		});

		if (!res.ok) {
			throw await createApiError(res);
		}

		const items: ApiCollectionInfo[] = await res.json();
		for (const item of items) {
			yield {
				slug: item.slug,
				title: item.title,
				description: item.description,
				owner: item.owner,
				items: item.items,
				private: item.private,
				upvotes: item.upvotes,
				position: item.position,
				theme: item.theme,
				shareUrl: item.shareUrl,
				lastUpdated: new Date(item.lastUpdated),
				isUpvotedByUser: item.isUpvotedByUser,
			};
		}

		const linkHeader = res.headers.get("Link");

		url = linkHeader ? parseLinkHeader(linkHeader).next : undefined;
	}
}

//
