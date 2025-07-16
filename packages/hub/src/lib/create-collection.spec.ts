import { it, describe, expect } from "vitest";

import { TEST_HUB_URL, TEST_ACCESS_TOKEN, TEST_USER } from "../test/consts";
import { createCollection } from "./create-collection";
import { deleteCollection } from "./delete-collection";

describe("createCollection", () => {
	it("should create a collection", async () => {
		let slug: string = "";

		try {
			const result = await createCollection({
				collection: {
					title: "Test Collection",
					namespace: TEST_USER,
					description: "This is a test collection",
					private: false,
				},
				accessToken: TEST_ACCESS_TOKEN,
				hubUrl: TEST_HUB_URL,
			});

			expect(result.slug.startsWith(`${TEST_USER}/test-collection`)).toBe(true);

			slug = result.slug;
		} finally {
			await deleteCollection({
				slug,
				accessToken: TEST_ACCESS_TOKEN,
				hubUrl: TEST_HUB_URL,
			});
		}
	});
});
