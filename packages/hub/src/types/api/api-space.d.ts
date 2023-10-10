import type { SpaceRuntime, SpaceSdk } from "../public";

type Color = "red" | "yellow" | "green" | "blue" | "indigo" | "purple" | "pink" | "gray";

export interface ApiSpaceInfo {
	_id: string;
	id: string;
	arxivIds?: string[];
	author: string;
	cardExists?: true;
	cardError?: unknown;
	cardData?: unknown;
	contributors?: Array<{ user: string; _id: string }>;
	disabled: boolean;
	discussionsDisabled: boolean;
	duplicationDisabled: boolean;
	gated: false | "auto" | "manual";
	gitalyUid: string;
	lastAuthor: { email: string; user?: string };
	lastModified: string; // date
	likes: number;
	likesRecent: number;
	private: boolean;
	updatedAt: string; // date
	sha: string;
	subdomain: string;
	title: string;
	emoji: string;
	colorFrom: Color;
	colorTo: Color;
	pinned: boolean;
	siblings: Array<{ rfilename: string }>;
	sdk?: SpaceSdk;
	runtime?: SpaceRuntime;
	models?: string[];
	datasets?: string[];
	originSpace?: { _id: string; authorId: string };
}
