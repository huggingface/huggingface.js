import { describe, it } from "vitest";
import { TEST_ACCESS_TOKEN, TEST_HUB_URL } from "../test/consts";
import type { CollectionEntry } from "./get-collections";
import { getCollections } from "./get-collections";
//

describe("listCollections", () => {
	it("should fetch LFS file info", async () => {
		const results: CollectionEntry[] = [];
		for await (const entry of getCollections({
			slug: "latent-consistency/latent-consistency-models-loras-654cdd24e111e16f0865fba6",
			credentials: {
				accessToken: TEST_ACCESS_TOKEN,
			},
			hubUrl: TEST_HUB_URL,
		})) {
			//
			//
			results.push(entry);
			//
			console.log(entry);
			//

			//
		}
		//
	});

	//
});
