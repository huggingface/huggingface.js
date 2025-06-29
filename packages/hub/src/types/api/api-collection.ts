export interface ApiCollectionInfo {
	slug: string;
	title: string;
	description?: string;
	gating: boolean;
	lastUpdated: string;
	owner: {
		name: string;
	};
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
