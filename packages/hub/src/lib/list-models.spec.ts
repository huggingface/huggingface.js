import { describe, expect, it } from "vitest";
import type { ModelEntry } from "./list-models";
import { listModels } from "./list-models";

describe("listModels", () => {
	it("should list models for depth estimation", async () => {
		const results: ModelEntry[] = [];

		for await (const entry of listModels({
			search: { owner: "Intel", task: "depth-estimation" },
		})) {
			if (typeof entry.downloads === "number") {
				entry.downloads = 0;
			}
			if (typeof entry.likes === "number") {
				entry.likes = 0;
			}
			if (entry.updatedAt instanceof Date && !isNaN(entry.updatedAt.getTime())) {
				entry.updatedAt = new Date(0);
			}

			if (!["Intel/dpt-large", "Intel/dpt-hybrid-midas"].includes(entry.name)) {
				expect(entry.task).to.equal("depth-estimation");
				continue;
			}

			results.push(entry);
		}

		results.sort((a, b) => a.id.localeCompare(b.id));

		expect(results).deep.equal([
			{
				id: "621ffdc136468d709f17e709",
				name: "Intel/dpt-large",
				private: false,
				gated: false,
				downloads: 0,
				likes: 0,
				task: "depth-estimation",
				updatedAt: new Date(0),
			},
			{
				id: "638f07977559bf9a2b2b04ac",
				name: "Intel/dpt-hybrid-midas",
				gated: false,
				private: false,
				downloads: 0,
				likes: 0,
				task: "depth-estimation",
				updatedAt: new Date(0),
			},
		]);
	});
});
