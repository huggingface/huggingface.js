import { HUB_URL } from "../consts";
import { createApiError } from "../error";
import type { CredentialsParams } from "../types/public";
import { checkCredentials } from "../utils/checkCredentials";
import { parseLinkHeader } from "../utils/parseLinkHeader";
import type { ApiCollectionInfo } from "../types/api/api-collection";

export interface CollectionEntry {
	slug: string;
	title: string;
	description: string;
	gating: boolean;
	lastUpdated: Date;
	owner: string;
	items: {
		/**
		 * Unique ID of the item in the collection.
		 */
		item_object_id: string;
		/*
		 * ID of the underlying object on the Hub. Can be either a repo_id, a paper id or a collection slug.
		 * e.g. `"jbilcke-hf/ai-comic-factory"`, `"2307.09288"`, `"celinah/cerebras-function-calling-682607169c35fbfa98b30b9a"`.
		 */
		item_id: string;
		/**
		 * Type of the underlying object.
		 */
		item_type: "model" | "dataset" | "space" | "paper" | "collection";
		/**
		 * Position of the item in the collection.
		 */
		position: number;
	}[];
	theme: string;
	private: boolean;
	upvotes: number;
	isUpvotedByUser: boolean;
}

export async function* listCollections(
	params?: {
		search?: {
			/**
			 * Filter collections created by a specific user or organization.
			 */
			owner?: string;
			/**
			 * Filter collections containing a specific item. Value must be the item_type and item_id concatenated.
			 * Example: "models/teknium/OpenHermes-2.5-Mistral-7B", "datasets/rajpurkar/squad" or "papers/2311.12983".
			 */
			item?: string;
			/**
			 * Filter based on substrings for titles & descriptions.
			 */
			q?: string;
		};
		/**
		 * Sort the returned collections. Supported values are "lastModified", "trending" (default) and "upvotes".
		 */
		sort?: "lastModified" | "trending" | "upvotes";
		/**
		 * Limit the number of collections to be retruned. Maximum is 100, default is 100.
		 */
		limit?: number;
		hubUrl?: string;
		/**
		 * Custom fetch function to use instead of the default one, for example to use a proxy or edit headers.
		 */
		fetch?: typeof fetch;
	} & Partial<CredentialsParams>
): AsyncGenerator<CollectionEntry> {
	const accessToken = params && checkCredentials(params);

	let totalToFetch = params?.limit ?? Infinity;

	const search = new URLSearchParams([
		...Object.entries({
			limit: String(Math.min(totalToFetch, 100)),
			...(params?.search?.owner ? { owner: params.search.owner } : undefined),
			...(params?.search?.item ? { item: params.search.item } : undefined),
			...(params?.search?.q ? { q: params.search.q } : undefined),
		}),
	]).toString();

	let url: string | undefined = `${params?.hubUrl || HUB_URL}/api/collections?${search}`;

	while (url) {
		const res: Response = await (params?.fetch ?? fetch)(url, {
			headers: {
				accept: "application/json",
				...(accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined),
			},
		});

		if (!res.ok) {
			throw await createApiError(res);
		}

		const collections: ApiCollectionInfo[] = await res.json();

		for (const collection of collections) {
			yield {
				slug: collection.slug,
				title: collection.title,
				description: collection.description,
				gating: collection.gating,
				lastUpdated: new Date(collection.lastUpdated),
				owner: collection.owner.name,
				items: collection.items.map((collectionItem) => ({
					item_object_id: collectionItem._id,
					item_id: collectionItem.id,
					item_type: collectionItem.type,
					position: collectionItem.position,
				})),
				theme: collection.theme,
				private: collection.private,
				upvotes: collection.upvotes,
				isUpvotedByUser: collection.isUpvotedByUser,
			} as CollectionEntry;

			totalToFetch--;

			if (totalToFetch <= 0) {
				return;
			}
		}

		const linkHeader = res.headers.get("Link");

		url = linkHeader ? parseLinkHeader(linkHeader).next : undefined;
	}
}
