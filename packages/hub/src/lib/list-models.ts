import { HUB_URL } from "../consts";
import { createApiError } from "../error";
import type { ApiModelInfo } from "../types/api/api-model";
import type { Credentials, PipelineType } from "../types/public";
import { checkCredentials } from "../utils/checkCredentials";
import { parseLinkHeader } from "../utils/parseLinkHeader";

const EXPAND_KEYS = [
	"pipeline_tag",
	"private",
	"gated",
	"downloads",
	"likes",
	"lastModified",
] satisfies (keyof ApiModelInfo)[];

export interface ModelEntry {
	id: string;
	name: string;
	private: boolean;
	gated: false | "auto" | "manual";
	task?: PipelineType;
	likes: number;
	downloads: number;
	updatedAt: Date;
}

export async function* listModels(params?: {
	search?: {
		owner?: string;
		task?: PipelineType;
	};
	credentials?: Credentials;
	hubUrl?: string;
	/**
	 * Custom fetch function to use instead of the default one, for example to use a proxy or edit headers.
	 */
	fetch?: typeof fetch;
}): AsyncGenerator<ModelEntry> {
	checkCredentials(params?.credentials);
	const search = new URLSearchParams([
		...Object.entries({
			limit: "500",
			...(params?.search?.owner ? { author: params.search.owner } : undefined),
			...(params?.search?.task ? { pipeline_tag: params.search.task } : undefined),
		}),
		...EXPAND_KEYS.map((val) => ["expand", val] satisfies [string, string]),
	]).toString();
	let url: string | undefined = `${params?.hubUrl || HUB_URL}/api/models?${search}`;

	while (url) {
		const res: Response = await (params?.fetch ?? fetch)(url, {
			headers: {
				accept: "application/json",
				...(params?.credentials ? { Authorization: `Bearer ${params.credentials.accessToken}` } : undefined),
			},
		});

		if (!res.ok) {
			throw createApiError(res);
		}

		const items: ApiModelInfo[] = await res.json();

		for (const item of items) {
			yield {
				id: item._id,
				name: item.id,
				private: item.private,
				task: item.pipeline_tag,
				downloads: item.downloads,
				gated: item.gated,
				likes: item.likes,
				updatedAt: new Date(item.lastModified),
			};
		}

		const linkHeader = res.headers.get("Link");

		url = linkHeader ? parseLinkHeader(linkHeader).next : undefined;
	}
}
