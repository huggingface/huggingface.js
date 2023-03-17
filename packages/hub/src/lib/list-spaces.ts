import { URLSearchParams } from "url";
import { HUB_URL } from "../consts";
import { createApiError } from "../error";
import type { ApiSpaceInfo } from "../types/api/api-space";
import type { Credentials, SpaceSdk, Task } from "../types/public";
import { checkCredentials } from "../utils/checkCredentials";
import { parseLinkHeader } from "../utils/parseLinkHeader";

export interface SpaceEntry {
	id: string;
	name: string;
	sdk?: SpaceSdk;
	likes: number;
}

export async function* listSpaces(params?: {
	search?: {
		owner?: string;
	};
	credentials?: Credentials;
	hubUrl?: string;
}): AsyncGenerator<SpaceEntry> {
	checkCredentials(params?.credentials);
	const search = new URLSearchParams({
		...(params?.search?.owner ? { author: params.search.owner } : undefined),
	}).toString();
	let url: string | undefined = `${params?.hubUrl || HUB_URL}/api/spaces` + search ? "?" + search : "";

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

		const items: ApiSpaceInfo[] = await res.json();

		for (const item of items) {
			yield {
				id: item._id,
				name: item.id,
				sdk: item.sdk,
				likes: item.likes,
			};
		}

		const linkHeader = res.headers.get("Link");

		url = linkHeader ? parseLinkHeader(linkHeader).next : undefined;
	}
}
