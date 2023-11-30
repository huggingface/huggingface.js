import { it, describe } from "vitest";
import { TEST_ACCESS_TOKEN, TEST_HUB_URL } from "../test/consts";
import { deleteCollectionItem } from "./delete-collection-item";
// import { type Collection } from "../types/api/api-collection";
// import { type CollectionEntry, getCollections } from "./get-collections";

describe("addCollectionItem", () => {
	it("should add a collection item", async () => {
		// const collection: CollectionEntry[] = getCollections({
		// 	slug: "hub.js/this-is-new-collection-65673aad5c9bf462f0d7a254",
		// 	credentials: { accessToken: TEST_ACCESS_TOKEN },
		// 	hubUrl: TEST_HUB_URL,
		// });
		const result = await deleteCollectionItem({
			collection_slug: "hub.js/this-is-fourth-collection-656741c75c9bf462f0d805dc",
			item_object_id: "656872857eba14517ff2b1c6",
			missing_ok: false,
			credentials: { accessToken: TEST_ACCESS_TOKEN },
			hubUrl: TEST_HUB_URL,
		});
		console.log(result);
	}, 25000);
});
