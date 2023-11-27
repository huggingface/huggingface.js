import { describe, it } from "vitest";
// import type { CleEntry } from "./list-models";
import type { CollectionEntry } from "./get-collections";
import { getCollections } from "./get-collections";
// import { exit } from "process";
// import type { Collection } from "../types/api/api-collection";

describe("listCollections", () => {
	it("should fetch LFS file info", async () => {
		const results: CollectionEntry[] = [];
		for await (const entry of getCollections({
			slug: "latent-consistency/latent-consistency-models-loras-654cdd24e111e16f0865fba6",
			// additionalFields: ["subdomain"],
		})) {
			// if (entry.slug !== "TheBloke/recent-models-64f9a55bb3115b4f513ec026") {
			// 	continue;
			// }
			// if (typeof entry.likes === "number") {
			// 	entry.likes = 0;
			// }
			// if (entry.updatedAt instanceof Date) {
			// 	entry.updatedAt = new Date(0);
			// }
			results.push(entry);
			// results.push(entry);
			console.log(entry);
			// if (entry.slug === "TheBloke/recent-models-64f9a55bb3115b4f513ec026") {

			// }
		}
		// assert.strictEqual(info?., 183);
		// assert.strictEqual(info?.etag, '"41a0e56472bad33498744818c8b1ef2c-64"');
		// assert(info?.downloadLink);
	});

	// it("should list collections by clem", async () => {
	// 	const results: Collection[] = [];
	// 	for await (const entry of getCollections({
	// 		search: { slug: "TheBloke/recent-models-64f9a55bb3115b4f513ec026", owner: "TheBloke" },
	// 	})) {
	// 		if (entry.slug !== "TheBloke/recent-models-64f9a55bb3115b4f513ec026") {
	// 			continue;
	// 		}
	// 		// if (typeof entry.likes === "number") {
	// 		// 	entry.likes = 0;
	// 		// }
	// 		// if (entry.updatedAt instanceof Date) {
	// 		// 	entry.updatedAt = new Date(0);
	// 		// }
	// 		// results.push(entry);
	// 		results.push(entry);
	// 		console.log(results);
	// 		if (entry.slug === "TheBloke/recent-models-64f9a55bb3115b4f513ec026") {
	// 			exit;
	// 		}
	// 	}
	// 	// console.log(await getCollections({ slug: "TheBloke/recent-models-64f9a55bb3115b4f513ec026" }));
	// 	// AsyncGenerato = await getCollections({ slug: "TheBloke/recent-models-64f9a55bb3115b4f513ec026" })
	// 	// results.sort((a, b) => a.id.localeCompare(b.id));
	// 	// expect(results).deep.equal([
	// 	// 	{
	// 	// 		id: "621ffdc136468d709f17e709",
	// 	// 		name: "Intel/dpt-large",
	// 	// 		private: false,
	// 	// 		gated: false,
	// 	// 		downloads: 0,
	// 	// 		likes: 0,
	// 	// 		task: "depth-estimation",
	// 	// 		updatedAt: new Date(0),
	// 	// 	},
	// 	// 	{
	// 	// 		id: "638f07977559bf9a2b2b04ac",
	// 	// 		name: "Intel/dpt-hybrid-midas",
	// 	// 		gated: false,
	// 	// 		private: false,
	// 	// 		downloads: 0,
	// 	// 		likes: 0,
	// 	// 		task: "depth-estimation",
	// 	// 		updatedAt: new Date(0),
	// 	// 	},
	// 	// ]);
	// });
});
