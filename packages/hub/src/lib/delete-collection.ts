import { HUB_URL } from "../consts";
import { createApiError } from "../error";
import type { CredentialsParams } from "../types/public";
import { checkCredentials } from "../utils/checkCredentials";

export async function deleteCollection(
	params: {
		/**
		 * The slug of the collection to delete.
		 */
		collectionSlug: string;
		hubUrl?: string;
		/**
		 * Custom fetch function to use instead of the default one, for example to use a proxy or edit headers.
		 */
		fetch?: typeof fetch;
	} & Partial<CredentialsParams>
): Promise<void> {
	const accessToken = checkCredentials(params);

	const [namespace, slugId] = params.collectionSlug.split("/");

	if (!namespace || !slugId) {
		throw new TypeError(
			`"${params.collectionSlug}" is not a fully qualified slug. It should be of the form "{namespace}/{slugId}".`
		);
	}

	const res = await (params.fetch ?? fetch)(`${params.hubUrl ?? HUB_URL}/api/collections/${namespace}/${slugId}`, {
		method: "DELETE",
		headers: {
			Authorization: `Bearer ${accessToken}`,
			"Content-Type": "application/json",
		},
	});

	if (!res.ok) {
		throw await createApiError(res);
	}
}
