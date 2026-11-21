import { describe, expect, it } from "vitest";
import type { ModelDataMinimal } from "@huggingface/tasks";
import { getInferenceSnippets } from "../src/snippets/getInferenceSnippets.js";

const sentenceSimilarityModel: ModelDataMinimal = {
	id: "sentence-transformers/all-MiniLM-L6-v2",
	inference: "",
	pipeline_tag: "sentence-similarity",
	tags: [],
};

describe("sentence-similarity snippets", () => {
	it.each(["hf-inference", "auto"] as const)("passes both Python client arguments for %s", (provider) => {
		const snippets = getInferenceSnippets(sentenceSimilarityModel, provider);
		const pythonSnippet = snippets.find(({ client }) => client === "huggingface_hub")?.content;

		expect(pythonSnippet).toContain('sentence="That is a happy person",');
		expect(pythonSnippet).toContain(
			'other_sentences=["That is a happy dog", "That is a very happy person", "Today is a sunny day"],',
		);
		expect(pythonSnippet).toContain(`model="${sentenceSimilarityModel.id}"`);
		expect(pythonSnippet).not.toContain("source_sentence");
	});

	it("serializes custom sentences as Python string literals", () => {
		const snippets = getInferenceSnippets(sentenceSimilarityModel, "hf-inference", undefined, {
			inputs: {
				source_sentence: 'A "quoted" sentence\nwith a second line',
				sentences: ["It's similar", "A backslash: \\", "你好"],
			},
		});
		const pythonSnippet = snippets.find(({ client }) => client === "huggingface_hub")?.content;

		expect(pythonSnippet).toContain('sentence="A \\"quoted\\" sentence\\nwith a second line",');
		expect(pythonSnippet).toContain('other_sentences=["It\'s similar", "A backslash: \\\\", "你好"],');
	});

	it("keeps the HTTP input names for the other clients", () => {
		const snippets = getInferenceSnippets(sentenceSimilarityModel, "hf-inference", undefined, {
			inputs: { source_sentence: "A sentence", sentences: ["Another sentence"] },
		});
		const otherSnippets = snippets.filter(({ client }) => client !== "huggingface_hub");

		expect(otherSnippets.map(({ client }) => client).sort()).toEqual(["curl", "fetch", "huggingface.js", "requests"]);
		for (const { content } of otherSnippets) {
			expect(content).toContain("source_sentence");
			expect(content).toContain("sentences");
			expect(content).not.toContain("other_sentences");
		}
	});
});
