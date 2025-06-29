import { describe, expect, it } from "vitest";
import type { DatasetEntry } from "./list-datasets";
import { listDatasets } from "./list-datasets";

describe("listDatasets", () => {
	it("should list datasets from hf-doc-builder", async () => {
		const results: DatasetEntry[] = [];

		for await (const entry of listDatasets({ search: { owner: "hf-doc-build" } })) {
			if (entry.name !== "hf-doc-build/doc-build-dev-test") {
				continue;
			}
			if (typeof entry.downloads === "number") {
				entry.downloads = 0;
			}
			if (typeof entry.likes === "number") {
				entry.likes = 0;
			}
			if (entry.updatedAt instanceof Date && !isNaN(entry.updatedAt.getTime())) {
				entry.updatedAt = new Date(0);
			}

			results.push(entry);
		}

		expect(results).deep.equal([
			{
				id: "659086ddbea632dc9491adaf",
				name: "hf-doc-build/doc-build-dev-test",
				private: false,
				gated: false,
				downloads: 0,
				likes: 0,
				updatedAt: new Date(0),
			},
		]);
	});
});
