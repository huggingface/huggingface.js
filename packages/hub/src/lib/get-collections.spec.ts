import { describe, it } from "vitest";
//
import type { CollectionEntry } from "./get-collections";
import { getCollections } from "./get-collections";
//

describe("listCollections", () => {
	it("should fetch LFS file info", async () => {
		const results: CollectionEntry[] = [];
		for await (const entry of getCollections({
			slug: "latent-consistency/latent-consistency-models-loras-654cdd24e111e16f0865fba6",
			//
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
