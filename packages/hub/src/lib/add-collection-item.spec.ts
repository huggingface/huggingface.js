import { it, describe, expect } from "vitest";

import { TEST_HUB_URL, TEST_ACCESS_TOKEN, TEST_USER } from "../test/consts";
import { addCollectionItem } from "./add-collection-item";
import { listCollections } from "./list-collections";
import { collectionInfo } from "./collection-info";
import { deleteCollectionItem } from "./delete-collection-item";

describe("addCollectionItem", () => {
	it("should add a item to a collection", async () => {
		let slug: string = "";
		let itemId: string = "";

		try {
			for await (const entry of listCollections({
				search: { owner: [TEST_USER] },
				limit: 1,
				hubUrl: TEST_HUB_URL,
			})) {
				slug = entry.slug;
				break;
			}

			await addCollectionItem({
				slug,
				item: {
					type: "model",
					id: "quanghuynt14/TestAddCollectionItem",
				},
				note: "This is a test item",
				accessToken: TEST_ACCESS_TOKEN,
				hubUrl: TEST_HUB_URL,
			});

			const collection = await collectionInfo({
				slug,
				accessToken: TEST_ACCESS_TOKEN,
				hubUrl: TEST_HUB_URL,
			});

			const item = collection.items.find((item) => item.id === "quanghuynt14/TestAddCollectionItem");

			expect(item).toBeDefined();

			itemId = item?._id || "";
		} finally {
			await deleteCollectionItem({
				slug,
				itemId,
				accessToken: TEST_ACCESS_TOKEN,
				hubUrl: TEST_HUB_URL,
			});
		}
	});
});
