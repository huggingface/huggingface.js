import { afterEach, describe, expect, it, vi } from "vitest";
import { InferenceClient } from "../src/index.js";
import { inferenceProviderMappingCache } from "../src/lib/getInferenceProviderMapping.js";
import { ZaiImageToTextTask } from "../src/providers/zai-org.js";

const json = (body: unknown) => new Response(JSON.stringify(body), { headers: { "Content-Type": "application/json" } });
const mapping = (provider: string, hfModelId: string, providerId: string, task: string) =>
	json({ inferenceProviderMapping: [{ provider, hfModelId, providerId, status: "live", task }] });

describe("Provider custom fetch propagation", () => {
	afterEach(() => {
		vi.unstubAllGlobals();
		inferenceProviderMappingCache.clear();
	});

	it("uses the custom fetch for fal-ai queue polling, result and image download", async () => {
		const globalFetchMock = vi.fn();
		vi.stubGlobal("fetch", globalFetchMock);

		const customFetchMock = vi.fn<Parameters<typeof fetch>, ReturnType<typeof fetch>>(async (input) => {
			const url = String(input);
			if (url.includes("inferenceProviderMapping")) {
				return mapping("fal-ai", "acme/img", "fal-ai/acme-img", "text-to-image");
			}
			if (url.includes("/status")) {
				return json({ status: "COMPLETED" });
			}
			if (url.includes("/requests/r1")) {
				return json({ images: [{ url: "https://cdn.example/out.png" }] });
			}
			if (url === "https://cdn.example/out.png") {
				return new Response(new Blob(["image"], { type: "image/png" }));
			}
			return json({
				request_id: "r1",
				status: "IN_QUEUE",
				response_url: "https://queue.fal.run/fal-ai/acme-img/requests/r1",
			});
		});

		const output = await new InferenceClient("hf_token").textToImage(
			{ model: "acme/img", provider: "fal-ai", inputs: "a cat" },
			{ fetch: customFetchMock },
		);

		expect(output).toBeInstanceOf(Blob);
		expect(globalFetchMock).not.toHaveBeenCalled();
		expect(customFetchMock.mock.calls.map(([input]) => String(input))).toEqual(
			expect.arrayContaining([
				expect.stringContaining("/requests/r1/status"),
				expect.stringMatching(/\/requests\/r1\?/),
				"https://cdn.example/out.png",
			]),
		);
	});

	it("uses the custom fetch for zai image input downloads", async () => {
		const globalFetchMock = vi.fn();
		vi.stubGlobal("fetch", globalFetchMock);
		const customFetchMock = vi.fn<Parameters<typeof fetch>, ReturnType<typeof fetch>>(() =>
			Promise.resolve(new Response(new Blob(["image"], { type: "image/png" }))),
		);

		const payload = await new ZaiImageToTextTask().preparePayloadAsync(
			{ inputs: "https://example.com/image.png" } as never,
			undefined,
			customFetchMock,
		);

		expect((payload as Record<string, unknown>).inputs).toMatch(/^data:image\/png;base64,/);
		expect(customFetchMock).toHaveBeenCalledWith("https://example.com/image.png", { signal: undefined });
		expect(globalFetchMock).not.toHaveBeenCalled();
	});

	it("uses the custom fetch for hf-inference output URL downloads", async () => {
		const globalFetchMock = vi.fn();
		vi.stubGlobal("fetch", globalFetchMock);
		const customFetchMock = vi.fn<Parameters<typeof fetch>, ReturnType<typeof fetch>>(async (input) => {
			const url = String(input);
			if (url.includes("inferenceProviderMapping")) {
				return mapping("hf-inference", "acme/img", "acme/img", "text-to-image");
			}
			if (url === "https://cdn.example/out.png") {
				return new Response(new Blob(["image"], { type: "image/png" }));
			}
			return json({ output: ["https://cdn.example/out.png"] });
		});

		const output = await new InferenceClient("hf_token").textToImage(
			{ model: "acme/img", provider: "hf-inference", inputs: "a cat" },
			{ fetch: customFetchMock },
		);

		expect(output).toBeInstanceOf(Blob);
		expect(customFetchMock).toHaveBeenCalledWith("https://cdn.example/out.png", { signal: undefined });
		expect(globalFetchMock).not.toHaveBeenCalled();
	});

	it("keeps hf-inference b64_json data URL decoding on the global fetch", async () => {
		const nativeFetch = globalThis.fetch;
		const globalFetchMock = vi.fn<Parameters<typeof fetch>, ReturnType<typeof fetch>>((input, init) =>
			nativeFetch(input, init),
		);
		vi.stubGlobal("fetch", globalFetchMock);
		const customFetchMock = vi.fn<Parameters<typeof fetch>, ReturnType<typeof fetch>>(async (input) =>
			String(input).includes("inferenceProviderMapping")
				? mapping("hf-inference", "acme/img", "acme/img", "text-to-image")
				: json({ data: [{ b64_json: btoa("image") }] }),
		);

		const output = await new InferenceClient("hf_token").textToImage(
			{ model: "acme/img", provider: "hf-inference", inputs: "a cat" },
			{ fetch: customFetchMock },
		);

		expect(await (output as unknown as Blob).text()).toBe("image");
		expect(globalFetchMock).toHaveBeenCalledOnce();
		expect(String(globalFetchMock.mock.calls[0][0])).toMatch(/^data:image\/jpeg;base64,/);
		expect(customFetchMock.mock.calls.map(([input]) => String(input))).not.toContainEqual(
			expect.stringMatching(/^data:/),
		);
	});

	it("uses the custom fetch for the zai image input download through imageToText", async () => {
		const globalFetchMock = vi.fn();
		vi.stubGlobal("fetch", globalFetchMock);
		const customFetchMock = vi.fn<Parameters<typeof fetch>, ReturnType<typeof fetch>>(async (input) => {
			const url = String(input);
			if (url.includes("inferenceProviderMapping")) {
				return mapping("zai-org", "acme/ocr", "acme-ocr", "image-to-text");
			}
			if (url === "https://example.com/image.png") {
				return new Response(new Blob(["image"], { type: "image/png" }));
			}
			return json({ md_results: "# caption" });
		});

		const output = await new InferenceClient("hf_token").imageToText(
			{ model: "acme/ocr", provider: "zai-org", inputs: "https://example.com/image.png" } as never,
			{ fetch: customFetchMock },
		);

		expect(output.generated_text).toBe("# caption");
		expect(customFetchMock).toHaveBeenCalledWith("https://example.com/image.png", { signal: undefined });
		expect(globalFetchMock).not.toHaveBeenCalled();
	});
});
