import { describe, expect, it } from "vitest";
import { datasetInfo } from "./dataset-info";

describe("datasetInfo", () => {
	it("should return the dataset info", async () => {
		const info = await datasetInfo({
			name: "nyu-mll/glue",
		});
		expect(info).toEqual({
			id: "621ffdd236468d709f181e3f",
			downloads: expect.any(Number),
			gated: false,
			name: "nyu-mll/glue",
			updatedAt: expect.any(Date),
			likes: expect.any(Number),
			private: false,
		});
	});
});
