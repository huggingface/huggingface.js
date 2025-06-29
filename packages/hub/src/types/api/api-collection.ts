export interface ApiCollectionInfo {
	slug: string;
	title: string;
	description?: string;
	gating: boolean;
	lastUpdated: string;
	owner: {
		name: string;
	};
	/*
	 * The items list per collection is truncated to 4 items maximum.
	 * To retrieve all items from a collection, you need to make an additional call using its collection slug.
	 */
	items: ApiCollectionItemInfo[];
	theme: string;
	private: boolean;
	upvotes: number;
	isUpvotedByUser: boolean;
}

export interface ApiCollectionItemInfo {
	_id: string;
	id: string;
	type: "model" | "dataset" | "space" | "paper" | "collection";
	position: number;
}
