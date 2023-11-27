import { HUB_URL } from "../consts";
import { createApiError } from "../error";
import type { Collection } from "../types/api/api-collection";
import type { Credentials } from "../types/public";
import { checkCredentials } from "../utils/checkCredentials";
import type { ApiSpaceInfo } from "../types/api/api-space";
import type { ApiDatasetInfo } from "../types/api/api-dataset";
import type { ApiModelInfo } from "../types/api/api-model";
import type { ApiWhoAmIAuthInfo } from "../types/api/api-who-am-i";
// import { pick } from "../utils/pick";
// import { parseLinkHeader } from "../utils/parseLinkHeader";

// const EXPAND_KEYS = ["private", "position", "theme", "upvotes", "isUpvotedByUser"];

export interface CollectionEntry {
	slug: string;
	title: string;
	description?: string;
	owner?: ApiWhoAmIAuthInfo;
	lastUpdated: Date;
	items?: ApiModelInfo | ApiDatasetInfo | ApiSpaceInfo;
	position: number;
	private: boolean;
	theme: string;
	upvotes: number;
	shareUrl: string;
	isUpvotedByUser: boolean;
}

export async function* getCollections(params: {
	// token?: string;
	// search?: {
	// owner: string;
	slug: string;
	// };
	credentials?: Credentials;
	hubUrl?: string;
	/**
	 * Custom fetch function to use instead of the default one, for example to use a proxy or edit headers.
	 */
	fetch?: typeof fetch;
	additionalFields?: Array<keyof Collection>;
}): AsyncGenerator<CollectionEntry> {
	checkCredentials(params.credentials);
	// const search = new URLSearchParams([
	// 	...Object.entries({ limit: "500", ...(params?.slug ? { slug: params?.slug } : undefined) }),
	// 	...[...EXPAND_KEYS, ...(params?.additionalFields ?? [])].map((val) => ["expand", val] satisfies [string, string]),
	// ]).toString();
	const url: string | undefined = `${params?.hubUrl || HUB_URL}/api/collections?${params.slug}`;

	// while (url) {
	if (url) {
		const res: Response = await (params.fetch ?? fetch)(url, {
			headers: {
				accept: "application/json",
				...(params?.credentials ? { Authorization: `Bearer ${params.credentials.accessToken}` } : undefined),
			},
		});

		if (!res.ok) {
			throw createApiError(res);
		}

		const items: Collection[] = await res.json();
		// console.log(items);
		for (const item of items) {
			if (item.slug == params.slug) {
				yield {
					// ...(params?.additionalFields && pick(item, params.additionalFields)),
					slug: item.slug,
					title: item.title,
					description: item.description,
					owner: item.owner,
					items: item.items,
					lastUpdated: new Date(item.lastUpdated),
					position: item.position,
					private: item.private,
					theme: item.theme,
					upvotes: item.upvotes,
					shareUrl: item.shareUrl,
					isUpvotedByUser: item.isUpvotedByUser,
				};
			}
		}
	}
}
/*{
	"slug": "TheBloke/recent-models-last-100-repos-sorted-by-creation-date-64f9a55bb3115b4f513ec026",
	"title": "Recent models: last 100 repos, sorted by creation date",
	"description": "The last 100 repos I have created. Sorted by creation date descending, so the most recently created repos appear at the top.",
	"lastUpdated": "2023-11-25T02:06:56.628Z",
	"owner": {
		"avatarUrl": "https://aeiljuispo.cloudimg.io/v7/https://cdn-uploads.huggingface.co/production/uploads/6426d3f3a7723d62b53c259b/tvPikpAzKTKGN5wrpadOJ.jpeg?w=200&h=200&f=face",
		"fullname": "Tom Jobbins",
		"name": "TheBloke",
		"type": "user",
		"isPro": true,
		"isHf": false
	},
	"items": [
		{
			"_id": "656156b4280cd6b7108c6308",
			"position": 0,
			"type": "model",
			"author": "TheBloke",
			"authorData": {
				"avatarUrl": "https://aeiljuispo.cloudimg.io/v7/https://cdn-uploads.huggingface.co/production/uploads/6426d3f3a7723d62b53c259b/tvPikpAzKTKGN5wrpadOJ.jpeg?w=200&h=200&f=face",
				"fullname": "Tom Jobbins",
				"name": "TheBloke",
				"type": "user",
				"isPro": true,
				"isHf": false
			},
			"downloads": 0,
			"gated": false,
			"id": "TheBloke/juanako-7B-v1-GPTQ",
			"lastModified": "2023-11-25T01:59:26.000Z",
			"likes": 0,
			"pipeline_tag": "text-generation",
			"private": false,
			"repoType": "model",
			"isLikedByUser": false
		},
		{
			"_id": "656156b47a465cdcb34618f5",
			"position": 1,
			"type": "model",
			"author": "TheBloke",
			"authorData": {
				"avatarUrl": "https://aeiljuispo.cloudimg.io/v7/https://cdn-uploads.huggingface.co/production/uploads/6426d3f3a7723d62b53c259b/tvPikpAzKTKGN5wrpadOJ.jpeg?w=200&h=200&f=face",
				"fullname": "Tom Jobbins",
				"name": "TheBloke",
				"type": "user",
				"isPro": true,
				"isHf": false
			},
			"downloads": 0,
			"gated": false,
			"id": "TheBloke/juanako-7B-v1-AWQ",
			"lastModified": "2023-11-25T01:47:31.000Z",
			"likes": 0,
			"pipeline_tag": "text-generation",
			"private": false,
			"repoType": "model",
			"isLikedByUser": false
		},
		{
			"_id": "656156b5462e5ebcbfeb381d",
			"position": 2,
			"type": "model",
			"author": "TheBloke",
			"authorData": {
				"avatarUrl": "https://aeiljuispo.cloudimg.io/v7/https://cdn-uploads.huggingface.co/production/uploads/6426d3f3a7723d62b53c259b/tvPikpAzKTKGN5wrpadOJ.jpeg?w=200&h=200&f=face",
				"fullname": "Tom Jobbins",
				"name": "TheBloke",
				"type": "user",
				"isPro": true,
				"isHf": false
			},
			"downloads": 0,
			"gated": false,
			"id": "TheBloke/juanako-7B-v1-GGUF",
			"lastModified": "2023-11-25T01:33:55.000Z",
			"likes": 0,
			"private": false,
			"repoType": "model",
			"isLikedByUser": false
		},
		{
			"_id": "6561329c2c671784e2b2ccb6",
			"position": 3,
			"type": "model",
			"author": "TheBloke",
			"authorData": {
				"avatarUrl": "https://aeiljuispo.cloudimg.io/v7/https://cdn-uploads.huggingface.co/production/uploads/6426d3f3a7723d62b53c259b/tvPikpAzKTKGN5wrpadOJ.jpeg?w=200&h=200&f=face",
				"fullname": "Tom Jobbins",
				"name": "TheBloke",
				"type": "user",
				"isPro": true,
				"isHf": false
			},
			"downloads": 0,
			"gated": false,
			"id": "TheBloke/smartyplats-7B-v2-GPTQ",
			"lastModified": "2023-11-24T23:12:17.000Z",
			"likes": 0,
			"pipeline_tag": "text-generation",
			"private": false,
			"repoType": "model",
			"isLikedByUser": false
		}
	],
	"theme": "green",
	"private": false,
	"upvotes": 180,
	"isUpvotedByUser": false
},*/
