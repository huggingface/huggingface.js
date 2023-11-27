import type { ApiWhoAmIAuthInfo } from "./api-who-am-i";
import type { ApiSpaceInfo } from "../types/api/api-space";
import type { ApiDatasetInfo } from "../types/api/api-dataset";
import type { ApiModelInfo } from "../types/api/api-model";

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
}
