import { describe, expect, it } from "vitest";
import { XetBlob } from "./XetBlob";

describe("XetBlob", () => {
	it("should lazy load the first 22 bytes", async () => {
		const blob = new XetBlob({
			repo: {
				type: "model",
				name: "celinah/xet-experiments",
			},
			hash: "7b3b6d07673a88cf467e67c1f7edef1a8c268cbf66e9dd9b0366322d4ab56d9b",
			size: 5_234_139_343,
		});

		expect(await blob.slice(10, 22).text()).toBe("__metadata__");
	}, 30_000);
});
