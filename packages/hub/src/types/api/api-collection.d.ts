import type { Task } from "../public";

type CollectionItemType = "model" | "dataset" | "space" | "paper";

export interface CollectionItem{
    _id: string;
	id: string;
	arxivIds: string[];
	author?: string;
    item_object_id: string // id in database
    item_id: string;  // repo_id or paper id
    item_type: CollectionItemType;
    position: number;
    note?: string;

}
export interface Collection{
	_id: string;
	id: string;
	arxivIds: string[];
	author?: string;
	slug: string;
    title: string;
    owner: string;
    items?: CollectionItem;
    last_updated: string; // convert to date
    position: number;
    private: bool
    theme: string;
    upvotes: number;
    description?: string;
}
