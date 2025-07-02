import { HUB_URL } from "../consts";
import { createApiError } from "../error";
import type { ApiCreateCollectionPayload } from "../types/api/api-create-collection";
import type { CredentialsParams } from "../types/public";
import { checkCredentials } from "../utils/checkCredentials";

export async function createCollection(
	params: {
		hubUrl?: string;
		/**
		 * Custom fetch function to use instead of the default one, for example to use a proxy or edit headers.
		 */
		fetch?: typeof fetch;
	} & ApiCreateCollectionPayload &
		Partial<CredentialsParams>
): Promise<{ collectionSlug: string }> {
	const accessToken = checkCredentials(params);

	const res = await (params.fetch ?? fetch)(`${params.hubUrl ?? HUB_URL}/api/collections`, {
		method: "POST",
		body: JSON.stringify({
			title: params.title,
			namespace: params.namespace,
			description: params.description,
			private: params.private,
		} satisfies ApiCreateCollectionPayload),
		headers: {
			Authorization: `Bearer ${accessToken}`,
			"Content-Type": "application/json",
		},
	});

	if (!res.ok) {
		throw await createApiError(res);
	}

	const output = await res.json();
	return { collectionSlug: output.slug };
}
