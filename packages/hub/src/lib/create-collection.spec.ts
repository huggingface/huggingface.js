import { it, describe, expect } from "vitest";

import { TEST_HUB_URL, TEST_ACCESS_TOKEN } from "../test/consts";
import { createCollection } from "./create-collection";
import { whoAmI } from "./who-am-i";
import { deleteCollection } from "./delete-collection";

describe("createCollection", () => {
	it("should create a collection", async () => {
		let slug: string = "";

		try {
			const user = await whoAmI({
				hubUrl: TEST_HUB_URL,
				accessToken: TEST_ACCESS_TOKEN,
			});

			const result = await createCollection({
				collection: {
					title: "Test Collection",
					namespace: user.name,
					description: "This is a test collection",
					private: false,
				},
				accessToken: TEST_ACCESS_TOKEN,
				hubUrl: TEST_HUB_URL,
			});

			expect(result.slug.startsWith(`${user.name}/test-collection`)).toBe(true);

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
