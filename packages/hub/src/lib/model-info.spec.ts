import { describe, expect, it } from "vitest";
import { modelInfo } from "./model-info";

describe("modelInfo", () => {
	it("should return the model info", async () => {
		const info = await modelInfo({
			name: "openai-community/gpt2",
			additionalFields: ["author"],
		});
		expect(info).toEqual({
			id: "621ffdc036468d709f17434d",
			downloads: expect.any(Number),
			author: "OpenAI",
			gated: false,
			name: "openai-community/gpt2",
			updatedAt: expect.any(Date),
			likes: expect.any(Number),
			task: "text-generation",
			private: false,
		});
	});
});
