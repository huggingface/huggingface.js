import { afterEach, describe, expect, it, vi } from "vitest";
import { resolveProvider } from "../src/lib/getInferenceProviderMapping.js";
import { inferenceProviderMappingCache } from "../src/lib/getInferenceProviderMapping.js";

describe("resolveProvider with provider='auto'", () => {
	afterEach(() => {
		vi.unstubAllGlobals();
		inferenceProviderMappingCache.clear();
	});

	it("uses the custom fetch passed in options for the provider-mapping pre-flight call", async () => {
		const globalFetchMock = vi.fn();
		vi.stubGlobal("fetch", globalFetchMock);

		const customFetchMock = vi.fn<Parameters<typeof fetch>, ReturnType<typeof fetch>>(() =>
			Promise.resolve(
				new Response(
					JSON.stringify({
						inferenceProviderMapping: [
							{
								provider: "hf-inference",
								hfModelId: "my-model",
								providerId: "my-model",
								status: "live",
								task: "text-classification",
							},
						],
					}),
					{ headers: { "Content-Type": "application/json" } },
				),
			),
		);

		const provider = await resolveProvider("auto", "my-model", undefined, { fetch: customFetchMock });

		expect(provider).toBe("hf-inference");
		expect(customFetchMock).toHaveBeenCalledTimes(1);
		expect(globalFetchMock).not.toHaveBeenCalled();
	});
	it("skips the providers the Hub lists that this client no longer supports", async () => {
		const customFetchMock = vi.fn<Parameters<typeof fetch>, ReturnType<typeof fetch>>(() =>
			Promise.resolve(
				new Response(
					JSON.stringify({
						inferenceProviderMapping: [
							{
								provider: "together",
								hfModelId: "my-model",
								providerId: "my-model",
								status: "live",
								task: "text-to-image",
							},
							{
								provider: "fal-ai",
								hfModelId: "my-model",
								providerId: "my-model",
								status: "live",
								task: "text-to-image",
							},
						],
					}),
					{ headers: { "Content-Type": "application/json" } },
				),
			),
		);

		expect(await resolveProvider("auto", "my-model", undefined, { fetch: customFetchMock })).toBe("fal-ai");
	});
});
