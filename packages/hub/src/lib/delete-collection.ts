import { HUB_URL } from "../consts";
import { createApiError } from "../error";
import type { CredentialsParams } from "../types/public";
import { checkCredentials } from "../utils/checkCredentials";
import { fetchWithServerWarnings } from "../utils/serverWarnings";

export async function deleteCollection(
	params: {
		/**
		 * The slug of the collection to delete.
		 */
		slug: string;
		hubUrl?: string;
		/**
		 * Custom fetch function to use instead of the default one, for example to use a proxy or edit headers.
		 */
		fetch?: typeof fetch;
	} & Partial<CredentialsParams>,
): Promise<void> {
	if (!params.slug) {
		throw new TypeError("slug is required");
	}

	const accessToken = checkCredentials(params);

	const res = await fetchWithServerWarnings(params.fetch)(
		`${params.hubUrl ?? HUB_URL}/api/collections/${params.slug}`,
		{
			method: "DELETE",
			headers: {
				Authorization: `Bearer ${accessToken}`,
				"Content-Type": "application/json",
			},
		},
	);

	if (!res.ok) {
		throw await createApiError(res);
	}
}
