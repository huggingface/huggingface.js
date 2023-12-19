import { HUB_URL } from "../consts";
import { createApiError } from "../error";
import type { Collection, UpdateCollectionItemPayload } from "../types/api/api-collection";
import type { Credentials } from "../types/public";
import { checkCredentials } from "../utils/checkCredentials";

export async function updateCollectionItem(params: {
	collection_slug: string;
	item_object_id: string;
	note?: string;
	position?: number;
	credentials?: Credentials;
	hubUrl?: string;
	/**
	 * Custom fetch function to use instead of the default one, for example to use a proxy or edit headers.
	 */
	fetch?: typeof fetch;
}): Promise<Collection> {
	checkCredentials(params.credentials);

	const res = await (params.fetch ?? fetch)(
		`${params.hubUrl ?? HUB_URL}/api/collections/${params.collection_slug}/items/${params.item_object_id}`,
		{
			method: "PATCH",
			body: JSON.stringify({
				note: params.note,
				position: params.position,
			} satisfies UpdateCollectionItemPayload),
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
