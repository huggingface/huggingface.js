import { URLSearchParams } from "url";
import { HUB_URL } from "../consts";
import { createApiError } from "../error";
import type { ApiModelInfo } from "../types/api/api-model";
import type { Credentials, Task } from "../types/public";
import { checkCredentials } from "../utils/checkCredentials";
import { parseLinkHeader } from "../utils/parseLinkHeader";

const EXPAND_KEYS = ["gated", "pipeline_tag", "private", "gated", "downloads"] satisfies (keyof ApiModelInfo)[];

export interface ModelEntry {
	id: string;
	name: string;
	private: boolean;
	gated: false | "auto" | "manual";
	task?: Task;
	likes: number;
	downloads: number;
	updatedAt: Date;
}

export async function* listModels(params?: {
	search?: {
		owner?: string;
	};
	credentials?: Credentials;
	hubUrl?: string;
}): AsyncGenerator<ModelEntry> {
	checkCredentials(params?.credentials);
	const search = new URLSearchParams([
		...Object.entries({
			limit: "500",
			...(params?.search?.owner ? { author: params.search.owner } : undefined),
		}),
		...EXPAND_KEYS.map((val) => ["expand", val] satisfies [string, string]),
	]).toString();
	let url: string | undefined = `${params?.hubUrl || HUB_URL}/api/models?${search}`;

	while (url) {
		const res: Response = await fetch(url, {
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
