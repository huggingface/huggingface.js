import { URLSearchParams } from "url";
import { HUB_URL } from "../consts";
import { createApiError } from "../error";
import type { ApiModelInfo } from "../types/api/api-model";
import type { Credentials, Task } from "../types/public";
import { checkCredentials } from "../utils/checkCredentials";
import { parseLinkHeader } from "../utils/parseLinkHeader";

export interface ModelEntry {
	id:      string;
	name:    string;
	private: boolean;
	task?:   Task;
}

export async function* listModels(params?: {
	search?: {
		owner?: string;
	};
	credentials?: Credentials;
	hubUrl?:      string;
}): AsyncGenerator<ModelEntry> {
	checkCredentials(params?.credentials);
	const search = new URLSearchParams({
		...(params?.search?.owner ? { author: params.search.owner } : undefined),
	}).toString();
	let url: string | undefined = `${params?.hubUrl || HUB_URL}/api/models` + (search ? "?" + search : "");

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
				id:      item._id,
				name:    item.id,
				private: item.private,
				task:    item.pipeline_tag,
			};
		}

		const linkHeader = res.headers.get("Link");

		url = linkHeader ? parseLinkHeader(linkHeader).next : undefined;
	}
}
