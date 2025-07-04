import { describe, expect, it } from "vitest";
import { listCollections } from "./list-collections";
import type { ApiCollectionInfo } from "../types/api/api-collection";
import { TEST_HUB_URL } from "../test/consts";

describe("listCollections", () => {
	it("should list collections", async () => {
		const results: ApiCollectionInfo[] = [];

		for await (const entry of listCollections({
			search: { owner: ["quanghuynt14"] },
			hubUrl: TEST_HUB_URL,
		})) {
			if (entry.slug !== "quanghuynt14/test-collection-6866ff686ca2d2e0a1931507") {
				continue;
			}

			if (typeof entry.lastUpdated === "string") {
				entry.lastUpdated = "2025-07-03T22:18:56.239Z";
			}

			if (entry.items && Array.isArray(entry.items)) {
				entry.items.map((item) => {
					if ("lastModified" in item && typeof item.lastModified === "string") {
						item.lastModified = "2025-07-01T00:36:29.000Z";
					}
					if ("lastUpdated" in item && typeof item.lastUpdated === "string") {
						item.lastUpdated = "2025-07-01T00:41:27.525Z";
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
			slug: "quanghuynt14/test-collection-6866ff686ca2d2e0a1931507",
			title: "Test Collection",
			description: "This collection is only for test",
			gating: false,
			lastUpdated: "2025-07-03T22:18:56.239Z",
			owner: {
				_id: "6866ff3936a7677f427f99e3",
				avatarUrl: "/avatars/b51088e22fb7194888551365b1bafada.svg",
				fullname: "Quang-Huy Tran",
				name: "quanghuynt14",
				type: "user",
				isPro: false,
				isHf: false,
				isHfAdmin: false,
				isMod: false,
			},
			items: [],
			theme: "purple",
			private: false,
			upvotes: 0,
			isUpvotedByUser: false,
		});

		// Check for item type model
		expect(items[0]).deep.equal({
			_id: "686700086ca2d2e0a193150b",
			position: 0,
			type: "model",
			author: "quanghuynt14",
			authorData: {
				_id: "6866ff3936a7677f427f99e3",
				avatarUrl: "/avatars/b51088e22fb7194888551365b1bafada.svg",
				fullname: "Quang-Huy Tran",
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
			_id: "686701cd86ea6972ba6c9da5",
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
			_id: "6867000f6ca2d2e0a193150e",
			position: 2,
			type: "space",
			author: "quanghuynt14",
			authorData: {
				_id: "6866ff3936a7677f427f99e3",
				avatarUrl: "/avatars/b51088e22fb7194888551365b1bafada.svg",
				fullname: "Quang-Huy Tran",
				name: "quanghuynt14",
				type: "user",
				isPro: false,
				isHf: false,
				isHfAdmin: false,
				isMod: false,
			},
			colorFrom: "pink",
			colorTo: "indigo",
			createdAt: "2025-07-03T22:10:39.000Z",
			emoji: "🏆",
			id: "quanghuynt14/TestSpace",
			lastModified: "2025-07-01T00:36:29.000Z",
			likes: 0,
			pinned: false,
			private: false,
			sdk: "docker",
			repoType: "space",
			runtime: {
				stage: "BUILDING",
				hardware: {
					current: null,
					requested: "cpu-basic",
				},
				storage: null,
				gcTimeout: 172800,
				replicas: {
					current: 0,
					requested: 1,
				},
			},
			shortDescription: "This space is only for test",
			title: "TestSpace",
			isLikedByUser: false,
			trendingScore: 0,
			tags: ["docker", "region:us"],
		});

		// Check for item type collection
		expect(items[3]).deep.equal({
			_id: "68670014f25517a0a7eaf505",
			position: 3,
			type: "collection",
			id: "6866ff686ca2d2e0a1931507",
			slug: "quanghuynt14/test-collection-6866ff686ca2d2e0a1931507",
			title: "Test Collection",
			description: "This collection is only for test",
			lastUpdated: "2025-07-01T00:41:27.525Z",
			numberItems: 5,
			owner: {
				_id: "6866ff3936a7677f427f99e3",
				avatarUrl: "/avatars/b51088e22fb7194888551365b1bafada.svg",
				fullname: "Quang-Huy Tran",
				name: "quanghuynt14",
				type: "user",
				isPro: false,
				isHf: false,
				isHfAdmin: false,
				isMod: false,
			},
			theme: "purple",
			shareUrl: "https://hub-ci.huggingface.co/collections/quanghuynt14/test-collection-6866ff686ca2d2e0a1931507",
			upvotes: 0,
			isUpvotedByUser: false,
		});
	});
});
