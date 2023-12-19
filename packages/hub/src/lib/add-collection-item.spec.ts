import { it, describe } from "vitest";
import { TEST_ACCESS_TOKEN, TEST_HUB_URL } from "../test/consts";
import { addCollectionItem } from "./add-collection-item";

describe("addCollectionItem", () => {
	it("should add a collection item", async () => {
		const result = await addCollectionItem({
			collection_slug: "hub.js/this-is-new-collection-65673aad5c9bf462f0d7a254",
			item: { id: "hub.js/TEST-fa82dodtqee", type: "model" },
			note: "note added",
			exists_ok: false,
			credentials: { accessToken: TEST_ACCESS_TOKEN },
			hubUrl: TEST_HUB_URL,
		});
		console.log(result);
	}, 25000);
});
