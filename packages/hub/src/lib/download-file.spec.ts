import { expect, test, describe, assert } from "vitest";
import { downloadFile } from "./download-file";

describe("downloadFile", () => {
	test("should download regular file", async () => {
		const blob = await downloadFile({
			repo: {
				type: "model",
				name: "openai-community/gpt2",
			},
			path: "README.md",
		});

		const text = await blob?.slice(0, 1000).text();
		assert(
			text?.includes(`---
language: en
tags:
- exbert

license: mit
---


# GPT-2

Test the whole generation capabilities here: https://transformer.huggingface.co/doc/gpt2-large`)
		);
	});
	test("should downoad xet file", async () => {
		const blob = await downloadFile({
			repo: {
				type: "model",
				name: "celinah/xet-experiments",
			},
			path: "large_text.txt",
		});

		const text = await blob?.slice(0, 100).text();
		expect(text).toMatch("this is a text file.".repeat(10).slice(0, 100));
	});
});
