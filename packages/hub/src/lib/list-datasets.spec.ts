import { describe, expect, it } from "vitest";
import type { DatasetEntry } from "./list-datasets";
import { listDatasets } from "./list-datasets";

describe("listDatasets", () => {
	it("should list datasets from hf-doc-builder", async () => {
		const results: DatasetEntry[] = [];

		for await (const entry of listDatasets({ search: { owner: "hf-doc-build" }, hubUrl: "https://huggingface.co" })) {
			if (typeof entry.downloads === "number") {
				entry.downloads = 0;
			}

			results.push(entry);
		}

		expect(results).deep.equal([
			{
				id:        "6356b19985da6f13863228bd",
				name:      "hf-doc-build/doc-build",
				private:   false,
				downloads: 0,
			},
			{
				id:        "636a1b69f2f9ec4289c4c19e",
				name:      "hf-doc-build/doc-build-dev",
				private:   false,
				downloads: 0,
			},
		]);
	});
});
