import type { ApiWhoAmIAuthInfo } from "./api-who-am-i";
import type { ApiSpaceInfo } from "../types/api/api-space";
import type { ApiDatasetInfo } from "../types/api/api-dataset";
import type { ApiModelInfo } from "../types/api/api-model";
// import type { WhoAmIOrg, WhoAmIUser } from "./who-am-i";
// import type { WhoAmI } from "../../lib";

export type CollectionItemType = "space" | "dataset" | "model" | "paper";

export interface UpdateCollectionItemPayload {
	note?: string;
	position?: number;
}
export interface AddCollectionItemPayload {
	item: { id: string; type: CollectionItemType };
	note?: string;
	exists_ok: boolean;
}
export interface UpdateCollectionPayload {
	title?: string;
	description?: string;
	position?: number;
	private?: boolean;
	theme?: string;
}
export interface CreateCollectionPayload {
	title: string;
	namespace: string;
	private: boolean;
	description?: string;
	exists_ok: boolean;
}
export interface Collection {
	_id: string;
	id: string;
	arxivIds: string[];
	author?: string;
	slug: string;
	title: string;
	owner?: ApiWhoAmIAuthInfo;
	items?: ApiModelInfo | ApiDatasetInfo | ApiSpaceInfo;
	lastUpdated: string; // convert to date
	position: number;
	private: boolean;
	theme: string;
	upvotes: number;
	description?: string;
	shareUrl: string;
	subdomain: string;
	isUpvotedByUser: boolean;
	namespace?: string;
	exists_ok: boolean;
}
