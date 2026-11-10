import { HUB_URL } from "../consts";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { createApiError, type HubApiError } from "../error";
import type { CredentialsParams } from "../types/public";
import { checkCredentials } from "../utils/checkCredentials";
import { fetchWithServerWarnings } from "../utils/serverWarnings";

export interface PaperAuthor {
	name: string;
	hidden?: boolean;
	user?: {
		name: string;
		fullname?: string;
		avatarUrl?: string;
		isPro?: boolean;
	};
	[key: string]: unknown;
}

export interface PaperInfo {
	/** arXiv id, e.g. "1706.03762" */
	id: string;
	title?: string;
	summary?: string;
	publishedAt?: string;
	upvotes?: number;
	authors?: PaperAuthor[];
	discussionId?: string;
	ai_summary?: string;
	ai_keywords?: string[];
	organization?: Record<string, unknown> | null;
	projectPage?: string;
	githubRepo?: string;
	githubStars?: number;
	linkedModels?: Array<Record<string, unknown>>;
	linkedDatasets?: Array<Record<string, unknown>>;
	linkedSpaces?: Array<Record<string, unknown>>;
	numTotalModels?: number;
	numTotalDatasets?: number;
	numTotalSpaces?: number;
	[key: string]: unknown;
}

/** One entry of the daily papers list: the paper plus its daily-submission metadata. */
export interface DailyPaper {
	paper: PaperInfo;
	title?: string;
	summary?: string;
	publishedAt?: string;
	thumbnail?: string;
	numComments?: number;
	isAuthorParticipating?: boolean;
	mediaUrls?: string[];
	submittedBy?: Record<string, unknown> | null;
	organization?: Record<string, unknown> | null;
	[key: string]: unknown;
}

/** One result of a papers search, with highlighted match fragments. */
export interface PaperSearchResult {
	paper: PaperInfo;
	title?: string;
	summary?: string;
	highlightedTitle?: string;
	highlightedSummary?: string;
	publishedAt?: string;
	numComments?: number;
	thumbnail?: string;
	upvoted?: boolean;
	isAuthorParticipating?: boolean;
	[key: string]: unknown;
}

type PapersParams = {
	hubUrl?: string;
	fetch?: typeof fetch;
} & Partial<CredentialsParams>;

async function papersRequest<T>(params: PapersParams, path: string, query?: Record<string, string>): Promise<T> {
	const accessToken = params && checkCredentials(params);
	const searchParams = new URLSearchParams(query);

	const response = await fetchWithServerWarnings(params.fetch)(
		`${params?.hubUrl || HUB_URL}${path}${searchParams.size > 0 ? `?${searchParams.toString()}` : ""}`,
		{
			headers: {
				...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
			},
		},
	);

	if (!response.ok) {
		throw await createApiError(response);
	}

	return response.json();
}

/**
 * List the daily papers published on the Hub, optionally filtered by date, week, month or submitter.
 */
export async function listDailyPapers(
	params: PapersParams & {
		/** Page number */
		p?: number;
		limit?: number;
		sort?: "publishedAt" | "trending";
		/** ISO date (YYYY-MM-DD) */
		date?: string;
		/** ISO week (YYYY-Www), e.g. "2025-W09" */
		week?: string;
		/** ISO month (YYYY-MM), e.g. "2025-02" */
		month?: string;
		submitter?: string;
	},
): Promise<DailyPaper[]> {
	const query: Record<string, string> = {};
	if (params.p !== undefined) {
		query.p = String(params.p);
	}
	if (params.limit !== undefined) {
		query.limit = String(params.limit);
	}
	if (params.sort !== undefined) {
		query.sort = params.sort;
	}
	if (params.date !== undefined) {
		query.date = params.date;
	}
	if (params.week !== undefined) {
		query.week = params.week;
	}
	if (params.month !== undefined) {
		query.month = params.month;
	}
	if (params.submitter !== undefined) {
		query.submitter = params.submitter;
	}
	return papersRequest<DailyPaper[]>(params, "/api/daily_papers", query);
}

/**
 * Search papers published on the Hub.
 */
export async function listPapers(
	params: PapersParams & { query?: string; limit?: number } = {},
): Promise<PaperSearchResult[]> {
	const query: Record<string, string> = {};
	if (params.query !== undefined) {
		query.q = params.query;
	}
	if (params.limit !== undefined) {
		query.limit = String(params.limit);
	}
	return papersRequest<PaperSearchResult[]>(params, "/api/papers/search", query);
}

/**
 * Get detailed information about a paper by its (arXiv) id.
 */
export async function paperInfo(params: PapersParams & { id: string }): Promise<PaperInfo> {
	return papersRequest<PaperInfo>(params, `/api/papers/${params.id}`);
}
