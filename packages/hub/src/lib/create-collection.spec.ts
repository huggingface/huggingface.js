import { it, describe, expect } from "vitest";

import { TEST_HUB_URL, TEST_ACCESS_TOKEN } from "../test/consts";
import { createCollection } from "./create-collection";
import { whoAmI } from "./who-am-i";
import { deleteCollection } from "./delete-collection";

describe("createCollection", () => {
	it("should create a collection", async () => {
		let collectionSlug: string = "";

		try {
			const user = await whoAmI({
				hubUrl: TEST_HUB_URL,
				accessToken: TEST_ACCESS_TOKEN,
			});

			const result = await createCollection({
				title: "Test Collection",
				namespace: user.name,
				description: "This is a test collection",
				private: false,
				accessToken: TEST_ACCESS_TOKEN,
				hubUrl: TEST_HUB_URL,
			});

			expect(result.collectionSlug.startsWith(`${user.name}/test-collection`)).toBe(true);

			collectionSlug = result.collectionSlug;
		} finally {
			await deleteCollection({
				collectionSlug,
				accessToken: TEST_ACCESS_TOKEN,
				hubUrl: TEST_HUB_URL,
			});
		}
	});
});
