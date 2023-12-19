import { HUB_URL } from "../consts";
import { createApiError } from "../error";
import type { Credentials } from "../types/public";
import { checkCredentials } from "../utils/checkCredentials";
import { getCollection } from "./get-collection";
import type { CollectionEntry } from "./get-collection";
import { CreateCollectionPayload } from "../types/api/api-collection";

export async function createCollection(params: {
	title: string;
	namespace: string;
	description?: string;
	private: boolean;
	exists_ok: boolean;
	credentials?: Credentials;
	hubUrl?: string;
	/**
	 * Custom fetch function to use instead of the default one, for example to use a proxy or edit headers.
	 */
	fetch?: typeof fetch;
}): Promise<CollectionEntry> {
	checkCredentials(params.credentials);

	if (!params.namespace) {
		throw new Error(`Namespace was not provided`);
	}
	if (!params.title) {
		throw new Error(`Title was not provided`);
	}
	const res = await (params.fetch ?? fetch)(`${params.hubUrl ?? HUB_URL}/api/collections`, {
		method: "POST",
		body: JSON.stringify({
			title: params.title,
			namespace: params.namespace,
			description: params.description,
			private: params.private,
			exists_ok: params.exists_ok,
		} satisfies CreateCollectionPayload),
		headers: {
			Authorization: `Bearer ${params.credentials?.accessToken}`,
			"Content-Type": "application/json",
		},
	});
	if (!res.ok) {
		if (params.exists_ok && res.status == 409) {
			// # Collection already exists and `exists_ok=True`
			const response = await res.json();
			return await getCollection({
				slug: response["slug"],
				credentials: params.credentials,
				hubUrl: params.hubUrl,
			});
		} else {
			throw await createApiError(res);
		}
	}

	const collection = await res.json();
	return collection;
}
