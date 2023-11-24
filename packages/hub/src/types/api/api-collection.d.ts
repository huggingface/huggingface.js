import type { ApiWhoAmIAuthInfo } from "./api-who-am-i";
import type { Task } from "../public";

type CollectionItemType = "model" | "dataset" | "space" | "paper";

export interface CollectionItem{
    _id: string;
	id: string;
	arxivIds: string[];
	author?: string;
    type?: CollectionItemType;
    position: number;
    note?: string;
    authorData?: ApiWhoAmIAuthInfo;
    downloads: number;
    gated: boolean;
    lastModified: string; //convert to date
    likes: number;
    pipeline_tag: Task;
    private:false | "auto" | "manual";
    isLikedByUser: boolean;
}
export interface Collection{
	_id: string;
	id: string;
	arxivIds: string[];
	author?: string;
	slug: string;
    title: string;
    owner?: ApiWhoAmIAuthInfo;
    items?: CollectionItem;
    last_updated: string; // convert to date
    position: number;
    private: boolean;
    theme: string;
    upvotes: number;
    description?: string;
    isUpvotedByUser: boolean;
}
