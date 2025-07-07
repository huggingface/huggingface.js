import { HUB_URL } from "../consts";
import { createApiError } from "../error";
import type { ApiCollectionInfo } from "../types/api/api-collection";
import type { CredentialsParams } from "../types/public";
import { checkCredentials } from "../utils/checkCredentials";

export async function collectionInfo(
	params: {
		/**
		 * The slug of the collection.
		 */
		collectionSlug: string;
		hubUrl?: string;
		/**
		 * Custom fetch function to use instead of the default one, for example to use a proxy or edit headers.
		 */
		fetch?: typeof fetch;
	} & Partial<CredentialsParams>
): Promise<ApiCollectionInfo & { position: number; shareUrl: string }> {
	const accessToken = checkCredentials(params);

	const res = await (params.fetch ?? fetch)(`${params.hubUrl ?? HUB_URL}/api/collections/${params.collectionSlug}`, {
		headers: {
			"Content-Type": "application/json",
			...(accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined),
		},
	});

	if (!res.ok) {
		throw await createApiError(res);
	}

	return await res.json();
}
