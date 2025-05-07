import { HUB_URL } from "../consts";
import { createApiError } from "../error";
import type { ApiCollectionInfo, CollectionItemType, AddCollectionItemPayload } from "../types/api/api-collection";
import type { Credentials } from "../types/public";
import { checkCredentials } from "../utils/checkCredentials";

export async function addCollectionItem(params: {
	collection_slug: string;
	item: { id: string; type: CollectionItemType };
	note?: string;
	exists_ok: boolean;
	credentials?: Credentials;
	hubUrl?: string;
	/**
	 * Custom fetch function to use instead of the default one, for example to use a proxy or edit headers.
	 */
	fetch?: typeof fetch;
}): Promise<ApiCollectionInfo> {
	checkCredentials(params.credentials);

	const res = await (params.fetch ?? fetch)(
		`${params.hubUrl ?? HUB_URL}/api/collections/${params.collection_slug}/items`,
		{
			method: "POST",
			body: JSON.stringify({
				item: { id: params.item.id, type: params.item.type },
				note: params.note,
				exists_ok: params.exists_ok,
			} satisfies AddCollectionItemPayload),
			headers: {
				Authorization: `Bearer ${params.credentials?.accessToken}`,
				"Content-Type": "application/json",
			},
		}
	);
	if (!res.ok) {
		throw await createApiError(res);
	}

	const collection = await res.json();
	return collection;
}
