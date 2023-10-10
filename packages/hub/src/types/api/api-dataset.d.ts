export interface ApiDatasetInfo {
	_id: string;
	id: string;
	arxivIds?: string[];
	author?: string;
	cardExists?: true;
	cardError?: unknown;
	cardData?: unknown;
	contributors?: Array<{ user: string; _id: string }>;
	disabled: boolean;
	discussionsDisabled: boolean;
	gated: false | "auto" | "manual";
	gitalyUid: string;
	lastAuthor: { email: string; user?: string };
	lastModified: string; // date
	likes: number;
	likesRecent: number;
	private: boolean;
	updatedAt: string; // date
	sha: string;
	files?: string[];
	citation?: string;
	description?: string;
	downloads: number;
	downloadsAllTime: number;
	previewable?: boolean;
	doi?: { id: string; commit: string };
}
