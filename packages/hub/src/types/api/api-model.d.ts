import type { PipelineType } from "../public";

export interface ApiModelInfo {
	_id: string;
	id: string;
	arxivIds: string[];
	author?: string;
	cardData: unknown;
	cardError: unknown;
	cardExists?: true;
	config: unknown;
	contributors: Array<{ user: string; _id: string }>;
	disabled: boolean;
	discussionsDisabled: boolean;
	doi?: { id: string; commit: string };
	downloads: number;
	downloadsAllTime: number;
	files: string[];
	gitalyUid: string;
	lastAuthor: { email: string; user?: string };
	lastModified: string; // convert to date
	likes: number;
	likesRecent: number;
	private: boolean;
	gated: false | "auto" | "manual";
	sha: string;
	spaces: string[];
	updatedAt: string; // convert to date
	pipeline_tag: PipelineType;
	"model-index": unknown;
}
