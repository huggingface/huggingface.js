import { HUB_URL } from "../consts";
import { createApiError } from "../error";
import type { ApiCollectionInfo } from "../types/api/api-collection";
import type { Credentials } from "../types/public";
import { checkCredentials } from "../utils/checkCredentials";
import type { ApiSpaceInfo } from "../types/api/api-space";
import type { ApiDatasetInfo } from "../types/api/api-dataset";
import type { ApiModelInfo } from "../types/api/api-model";
import type { ApiWhoAmIAuthInfo } from "../types/api/api-who-am-i";

//
export interface CollectionEntry {
	slug: string;
	title: string;
	description?: string;
	owner?: ApiWhoAmIAuthInfo;
	lastUpdated: Date;
	items?: (ApiModelInfo | ApiDatasetInfo | ApiSpaceInfo)[];
	position: number;
	private: boolean;
	theme: string;
	upvotes: number;
	shareUrl: string;
	isUpvotedByUser: boolean;
}

export async function getCollection(params: {
	//
	slug: string;
	//
	credentials?: Credentials;
	hubUrl?: string;
	/**
	 * Custom fetch function to use instead of the default one, for example to use a proxy or edit headers.
	 */
	fetch?: typeof fetch;
	additionalFields?: Array<keyof ApiCollectionInfo>;
}): Promise<CollectionEntry> {
	checkCredentials(params.credentials);

	const url = `${params?.hubUrl || HUB_URL}/api/collections/${params.slug}`;

	const res: Response = await (params.fetch ?? fetch)(url, {
		headers: {
			accept: "application/json",
			...(params?.credentials ? { Authorization: `Bearer ${params.credentials.accessToken}` } : undefined),
		},
	});

	if (!res.ok) {
		throw await createApiError(res);
	}

	const item: ApiCollectionInfo = await res.json();
	return {
		//
		slug: item.slug,
		title: item.title,
		description: item.description,
		owner: item.owner,
		items: item.items,
		lastUpdated: new Date(item.lastUpdated),
		position: item.position,
		private: item.private,
		theme: item.theme,
		upvotes: item.upvotes,
		shareUrl: item.shareUrl,
		isUpvotedByUser: item.isUpvotedByUser,
	};
}
