import { afterEach, describe, expect, it, vi } from "vitest";
import { HFInferenceTextToImageTask } from "../src/providers/hf-inference.js";
import { ReplicateTextToImageTask } from "../src/providers/replicate.js";
import { dataUrlFromBlob } from "../src/utils/dataUrlFromBlob.js";

describe("Blob data URL media types", () => {
	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it.each(["image/png", "image/webp", "audio/wav"])("preserves %s from the Blob", async (type) => {
		const blob = new Blob([new Uint8Array([0, 1, 255])], { type });
		expect(await dataUrlFromBlob(blob)).toBe(`data:${type};base64,AAH/`);
	});

	it("keeps the JPEG fallback when the Blob has no media type", async () => {
		expect(await dataUrlFromBlob(new Blob(["image"]))).toBe("data:image/jpeg;base64,aW1hZ2U=");
	});

	it("respects an explicit media type override", async () => {
		expect(await dataUrlFromBlob(new Blob(["image"], { type: "image/png" }), "image/webp")).toBe(
			"data:image/webp;base64,aW1hZ2U=",
		);
	});

	it("keeps the HF-Inference image response type in dataUrl output", async () => {
		const task = new HFInferenceTextToImageTask();
		vi.stubGlobal(
			"fetch",
			vi.fn(() =>
				Promise.resolve(
					new Response("png bytes", {
						headers: { "Content-Type": "image/png" },
					}),
				),
			),
		);
		const expected = "data:image/png;base64,cG5nIGJ5dGVz";
		expect(
			await task.getResponse({ output: ["https://example.com/output.png"] }, undefined, undefined, "dataUrl"),
		).toBe(expected);
	});

	it("keeps a downloaded Replicate image's response content type", async () => {
		vi.stubGlobal(
			"fetch",
			vi.fn(() =>
				Promise.resolve(
					new Response("webp bytes", {
						headers: { "Content-Type": "image/webp" },
					}),
				),
			),
		);
		const task = new ReplicateTextToImageTask();
		expect(await task.getResponse({ output: "https://example.com/output.webp" }, undefined, undefined, "dataUrl")).toBe(
			"data:image/webp;base64,d2VicCBieXRlcw==",
		);
	});
});
