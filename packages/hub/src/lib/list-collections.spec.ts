import { describe, expect, it } from "vitest";
import { listCollections } from "./list-collections";
import type { ApiCollectionInfo } from "../types/api/api-collection";

describe("listCollections", () => {
	it("should list collections", async () => {
		const results: ApiCollectionInfo[] = [];

		for await (const entry of listCollections({
			search: { owner: "quanghuynt14" },
		})) {
			if (entry.slug !== "quanghuynt14/test-6862f3b263a5cc509b9ee24a") {
				continue;
			}

			if (typeof entry.lastUpdated === "string") {
				entry.lastUpdated = "2025-07-21T00:36:29.000Z";
			}

			if (typeof entry.upvotes === "number") {
				entry.upvotes = 0;
			}

			if (typeof entry.owner.avatarUrl === "string") {
				entry.owner.avatarUrl = "https://cdn-avatars.huggingface.co/user-avatar.jpeg";
			}

			if (entry.items && Array.isArray(entry.items)) {
				entry.items.map((item) => {
					if ("owner" in item && typeof item.owner.avatarUrl === "string") {
						item.owner.avatarUrl = "https://cdn-avatars.huggingface.co/user-avatar.jpeg";
					}
					if ("authorData" in item && typeof item.authorData.avatarUrl === "string") {
						item.authorData.avatarUrl = "https://cdn-avatars.huggingface.co/user-avatar.jpeg";
					}
					if ("authorData" in item && typeof item.authorData.followerCount === "number") {
						item.authorData.followerCount = 0;
					}
					if ("downloads" in item && typeof item.downloads === "number") {
						item.downloads = 0;
					}
					if ("likes" in item && typeof item.likes === "number") {
						item.likes = 0;
					}
					if ("lastModified" in item && typeof item.lastModified === "string") {
						item.lastModified = "2025-07-01T00:36:29.000Z";
					}
					if ("lastUpdated" in item && typeof item.lastUpdated === "string") {
						item.lastUpdated = "2025-07-01T00:41:27.525Z";
					}
					if ("upvotes" in item && typeof item.upvotes === "number") {
						item.upvotes = 0;
					}
				});
			}

			results.push(entry);
		}

		const collection = results[0];
		const items = collection.items;
		collection.items = [];

		// Check all properties of the collection except items
		expect(collection).deep.equal({
			slug: "quanghuynt14/test-6862f3b263a5cc509b9ee24a",
			title: "Test",
			description: "this collection is only for test",
			gating: false,
			lastUpdated: "2025-07-21T00:36:29.000Z",
			owner: {
				_id: "6861a8be64cdb219ce188401",
				avatarUrl: "https://cdn-avatars.huggingface.co/user-avatar.jpeg",
				fullname: "Huy",
				name: "quanghuynt14",
				type: "user",
				isPro: false,
				isHf: false,
				isHfAdmin: false,
				isMod: false,
			},
			items: [],
			theme: "pink",
			private: false,
			upvotes: 0,
			isUpvotedByUser: false,
		});

		// Check for item type model
		expect(items[0]).deep.equal({
			_id: "68632ede07867696ac5d7ab1",
			position: 0,
			type: "model",
			author: "quanghuynt14",
			authorData: {
				_id: "6861a8be64cdb219ce188401",
				avatarUrl: "https://cdn-avatars.huggingface.co/user-avatar.jpeg",
				fullname: "Huy",
				name: "quanghuynt14",
				type: "user",
				isPro: false,
				isHf: false,
				isHfAdmin: false,
				isMod: false,
			},
			downloads: 0,
			gated: false,
			id: "quanghuynt14/TestModel",
			availableInferenceProviders: [],
			lastModified: "2025-07-01T00:36:29.000Z",
			likes: 0,
			private: false,
			repoType: "model",
			isLikedByUser: false,
		});

		// Check for item type dataset
		expect(items[1]).deep.equal({
			_id: "68632ee9c76d34d6031bab15",
			position: 1,
			type: "dataset",
			author: "quanghuynt14",
			downloads: 0,
			gated: false,
			id: "quanghuynt14/TestDataset",
			lastModified: "2025-07-01T00:36:29.000Z",
			private: false,
			repoType: "dataset",
			likes: 0,
			isLikedByUser: false,
		});

		// Check for item type space
		expect(items[2]).deep.equal({
			_id: "68632eeff8d2d420b6ad4b0d",
			position: 2,
			type: "space",
			ai_category: "Chatbots",
			ai_short_description: "Chat with an advanced virtual assistant",
			author: "quanghuynt14",
			authorData: {
				_id: "6861a8be64cdb219ce188401",
				avatarUrl: "https://cdn-avatars.huggingface.co/user-avatar.jpeg",
				fullname: "Huy",
				name: "quanghuynt14",
				type: "user",
				isPro: false,
				isHf: false,
				isHfAdmin: false,
				isMod: false,
			},
			colorFrom: "yellow",
			colorTo: "purple",
			createdAt: "2025-07-01T00:39:07.000Z",
			emoji: "💬",
			id: "quanghuynt14/TestSpace",
			lastModified: "2025-07-01T00:36:29.000Z",
			likes: 0,
			pinned: false,
			private: false,
			sdk: "gradio",
			repoType: "space",
			runtime: {
				stage: "RUNNING",
				hardware: {
					current: "cpu-basic",
					requested: "cpu-basic",
				},
				storage: null,
				gcTimeout: 172800,
				replicas: {
					current: 1,
					requested: 1,
				},
				devMode: false,
				domains: [
					{
						domain: "quanghuynt14-testspace.hf.space",
						stage: "READY",
					},
				],
				sha: "dc1332681707e8c7cfda491bbaf17a9aba5ff6d9",
			},
			shortDescription: "This is the space for test",
			title: "TestSpace",
			isLikedByUser: false,
			trendingScore: 0,
			tags: ["gradio", "region:us"],
		});

		// Check for item type collection
		expect(items[3]).deep.equal({
			_id: "68632ef6b13e0dc3b640854a",
			position: 3,
			type: "collection",
			id: "68632e8a911ddf966de476bc",
			slug: "quanghuynt14/another-test-collection-68632e8a911ddf966de476bc",
			title: "Another test collection",
			description: "This collection is only for test",
			lastUpdated: "2025-07-01T00:41:27.525Z",
			numberItems: 1,
			owner: {
				_id: "6861a8be64cdb219ce188401",
				avatarUrl: "https://cdn-avatars.huggingface.co/user-avatar.jpeg",
				fullname: "Huy",
				name: "quanghuynt14",
				type: "user",
				isPro: false,
				isHf: false,
				isHfAdmin: false,
				isMod: false,
			},
			theme: "blue",
			shareUrl: "https://huggingface.co/collections/quanghuynt14/another-test-collection-68632e8a911ddf966de476bc",
			upvotes: 0,
			isUpvotedByUser: false,
		});
	});
});
