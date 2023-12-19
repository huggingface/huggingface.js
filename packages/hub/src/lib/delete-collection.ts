import { HUB_URL } from "../consts";
import { createApiError } from "../error";
import type { Collection } from "../types/api/api-collection";
import type { Credentials } from "../types/public";
import { checkCredentials } from "../utils/checkCredentials";
// import type { WhoAmI } from "./who-am-i";

export async function deleteCollection(params: {
	slug: string;
	missing_ok: boolean;
	credentials?: Credentials;
	hubUrl?: string;
	/**
	 * Custom fetch function to use instead of the default one, for example to use a proxy or edit headers.
	 */
	fetch?: typeof fetch;
}): Promise<Collection> {
	checkCredentials(params.credentials);

	// if (params.namespace == null) {
	// 	// params.namespace = userInfo.name;
	// }
	const res = await (params.fetch ?? fetch)(`${params.hubUrl ?? HUB_URL}/api/collections/${params.slug}`, {
		method: "DELETE",
		headers: {
			Authorization: `Bearer ${params.credentials?.accessToken}`,
			"Content-Type": "application/json",
		},
	});
	if (!res.ok) {
		throw await createApiError(res);
	}

	const collection = await res.json();
	return collection["data"];
}

//
