import { afterEach, describe, expect, it, vi } from "vitest";
import { InferenceClient } from "../src/index.js";
import { inferenceProviderMappingCache } from "../src/lib/getInferenceProviderMapping.js";
import { ZaiImageToTextTask } from "../src/providers/zai-org.js";

const json = (body: unknown) => new Response(JSON.stringify(body), { headers: { "Content-Type": "application/json" } });

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
				return json({
					inferenceProviderMapping: [
						{
							provider: "fal-ai",
							hfModelId: "acme/img",
							providerId: "fal-ai/acme-img",
							status: "live",
							task: "text-to-image",
						},
					],
				});
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
});
