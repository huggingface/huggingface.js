export interface ApiCollectionInfo {
	slug: string;
	title: string;
	description?: string;
	gating: boolean;
	lastUpdated: string;
	owner: ApiCollectionOwner;
	/*
	 * The items list per collection is truncated to 4 items maximum.
	 * To retrieve all items from a collection, you need to make an additional call using its collection slug.
	 */
	items: ApiCollectionItem[];
	theme: string;
	private: boolean;
	upvotes: number;
	isUpvotedByUser: boolean;
}

export interface ApiCollectionOwner {
	_id?: string;
	avatarUrl: string;
	fullname: string;
	type: "user" | "org";
	name: string;
	isHf: boolean;
	isHfAdmin: boolean;
	isMod: boolean;
	isPro?: boolean;
	isEnterprise?: boolean;
	followerCount?: number;
}

export type ApiCollectionItem =
	| ApiCollectionItemModel
	| ApiCollectionItemDataset
	| ApiCollectionItemSpace
	| ApiCollectionItemPaper
	| ApiCollectionItemCollection;

export interface ApiCollectionItemBase {
	/** Internal database ID */
	_id: string;
	/** Position in the items list */
	position: number;
	/** One of 'model', 'dataset', 'space', 'paper', or 'collection' */
	type: "model" | "dataset" | "space" | "paper" | "collection";
	/** Can be either a repo_id, a paper id or a collection slug. */
	id: string;
	/** Note associated with the item. */
	note?: {
		html: string;
		text: string;
	};
	gallery?: string[];
}

/** Details for available inference providers for models */
export interface ModelAvailableInferenceProvider {
	provider: string;
	modelStatus: string;
	providerStatus: string;
	providerId: string;
	task: string;
	adapterWeightsPath?: string;
	adapterType?: string;
}

/** Extended properties for models */
export interface ApiCollectionItemModel extends ApiCollectionItemBase {
	type: "model";
	author: string;
	authorData: ApiCollectionOwner;
	downloads: number;
	gated: false | "auto" | "manual";
	availableInferenceProviders: ModelAvailableInferenceProvider[];
	lastModified: string;
	likes: number;
	isLikedByUser: boolean;
	pipeline_tag?: string;
	private: boolean;
	repoType: string;
	widgetOutputUrls?: string[];
	numParameters?: number;
}

/** Extended properties for datasets */
export interface ApiCollectionItemDataset extends ApiCollectionItemBase {
	type: "dataset";
	author: string;
	downloads: number;
	gated: false | "auto" | "manual";
	lastModified: string;
	likes: number;
	isLikedByUser: boolean;
	private: boolean;
	repoType: string;
	datasetsServerInfo?: {
		viewer: string;
		numRows: number;
		libraries: string[];
		formats?: string[];
		modalities?: string[];
		tags?: string[];
	};
}

/** Extended runtime details for spaces */
export interface SpaceRuntime {
	stage: string;
	hardware: {
		current: string | null;
		requested: string | null;
	};
	storage: string | null;
	gcTimeout?: number | null;
	replicas: {
		current?: number;
		requested: number | "auto";
	};
	devMode?: boolean;
	domains?: Array<{ domain: string; stage: string }>;
	sha?: string;
	errorMessage?: string | null;
}

/** Extended properties for spaces */
export interface ApiCollectionItemSpace extends ApiCollectionItemBase {
	type: "space";
	author: string;
	authorData: ApiCollectionOwner;
	createdAt: string;
	lastModified: string;
	likes: number;
	isLikedByUser: boolean;
	private: boolean;
	repoType: string;
	sdk?: string;
	tags: string[];
	pinned: boolean;
	emoji: string;
	colorFrom?: string;
	colorTo?: string;
	runtime: SpaceRuntime;
	shortDescription?: string;
	title: string;
	ai_short_description?: string;
	ai_category?: string;
	trendingScore: number;
}

/** Extended properties for papers */
export interface ApiCollectionItemPaper extends ApiCollectionItemBase {
	type: "paper";
	title: string;
	thumbnailUrl: string;
	upvotes: number;
	isUpvotedByUser: boolean;
	publishedAt: string;
}

/** Extended properties for collections */
export interface ApiCollectionItemCollection extends ApiCollectionItemBase {
	type: "collection";
	slug: string;
	title: string;
	description?: string;
	lastUpdated: string;
	numberItems: number;
	owner: ApiCollectionOwner;
	theme: string;
	shareUrl: string;
	upvotes: number;
	isUpvotedByUser: boolean;
}
