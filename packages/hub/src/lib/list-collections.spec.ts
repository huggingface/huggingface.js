import { describe, expect, it } from "vitest";
import type { CollectionEntry } from "./list-collections";
import { listCollections } from "./list-collections";

describe("listCollections", () => {
	it("should list collections for owner Google", async () => {
		const results: CollectionEntry[] = [];

		for await (const entry of listCollections({
			search: { owner: "google" },
		})) {
			if (entry.slug !== "google/gemma-3n-685065323f5984ef315c93f4") {
				continue;
			}

			if (typeof entry.title === "string") {
				entry.title = "Gemma 3n";
			}

			if (typeof entry.description === "string") {
				entry.description = "Gemma 3n is a large language model developed by Google.";
			}

			if (typeof entry.gating === "boolean") {
				entry.gating = false;
			}

			if (entry.lastUpdated instanceof Date && !isNaN(entry.lastUpdated.getTime())) {
				entry.lastUpdated = new Date(0);
			}

			if (typeof entry.items === "object" && Array.isArray(entry.items)) {
				entry.items = [
					{
						item_object_id: "685d6bcd8499e1b23cd3a79e",
						item_id: "google/gemma-3n-E4B-it",
						item_type: "model",
						position: 0,
					},
				];
			}

			if (typeof entry.theme === "string") {
				entry.theme = "purple";
			}

			if (typeof entry.private === "boolean") {
				entry.private = false;
			}

			if (typeof entry.upvotes === "number") {
				entry.upvotes = 0;
			}
			if (typeof entry.isUpvotedByUser === "boolean") {
				entry.isUpvotedByUser = false;
			}

			results.push(entry);
		}

		expect(results).deep.equal([
			{
				slug: "google/gemma-3n-685065323f5984ef315c93f4",
				title: "Gemma 3n",
				description: "Gemma 3n is a large language model developed by Google.",
				gating: false,
				lastUpdated: new Date(0),
				owner: "google",
				items: [
					{
						item_object_id: "685d6bcd8499e1b23cd3a79e",
						item_id: "google/gemma-3n-E4B-it",
						item_type: "model",
						position: 0,
					},
				],
				theme: "purple",
				private: false,
				upvotes: 0,
				isUpvotedByUser: false,
			},
		]);
	});
});
