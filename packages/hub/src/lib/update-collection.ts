import { HUB_URL } from "../consts";
import { createApiError } from "../error";
import type { ApiCollectionInfo, UpdateCollectionPayload } from "../types/api/api-collection";
import type { Credentials } from "../types/public";
import { checkCredentials } from "../utils/checkCredentials";
// import type { WhoAmI } from "./who-am-i";

export async function updateCollection(params: {
	slug: string;
	title?: string;
	description?: string;
	position?: number;
	private?: boolean;
	theme?: string;
	credentials?: Credentials;
	hubUrl?: string;
	/**
	 * Custom fetch function to use instead of the default one, for example to use a proxy or edit headers.
	 */
	fetch?: typeof fetch;
}): Promise<ApiCollectionInfo> {
	checkCredentials(params.credentials);

	// if (params.namespace == null) {
	// 	// params.namespace = userInfo.name;
	// }

	const res = await (params.fetch ?? fetch)(`${params.hubUrl ?? HUB_URL}/api/collections/${params.slug}`, {
		method: "PATCH",
		body: JSON.stringify({
			title: params.title,
			description: params.description,
			position: params.position,
			private: params.private,
			theme: params.theme,
		} satisfies UpdateCollectionPayload),
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
