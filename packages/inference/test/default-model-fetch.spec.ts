import { afterEach, describe, expect, it, vi } from "vitest";

const output = [{ label: "POSITIVE", score: 0.99 }];

function requestUrl(input: Parameters<typeof fetch>[0]): string {
	return typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
}

function mockFetch() {
	return vi.fn<Parameters<typeof fetch>, ReturnType<typeof fetch>>(async (input, init) => {
		const path = new URL(requestUrl(input)).pathname;
		let body: unknown;
		if (path === "/api/tasks") {
			body = { "text-classification": { models: [{ id: "test/model" }] } };
		} else if (path === "/api/models/test/model") {
			body = {
				inferenceProviderMapping: [
					{
						provider: "hf-inference",
						hfModelId: "test/model",
						providerId: "test/model",
						status: "live",
						task: "text-classification",
					},
				],
			};
		} else if (path === "/hf-inference/models/test/model" && init?.method === "POST") {
			body = [output];
		} else {
			throw new Error(`Unexpected request: ${requestUrl(input)}`);
		}
		return new Response(JSON.stringify(body), { headers: { "Content-Type": "application/json" } });
	});
}

describe("default-model discovery fetch", () => {
	afterEach(() => {
		vi.unstubAllGlobals();
	});

	describe.each(["constructor", "per-call", "override"] as const)("%s fetch", (mode) => {
		it.each([false, true])("uses custom fetch with explicit model=%s", async (explicitModel) => {
			vi.resetModules();
			const globalFetch = vi.fn(() => {
				throw new Error("Unexpected global fetch");
			});
			vi.stubGlobal("fetch", globalFetch);
			const { InferenceClient } = await import("../src/index.js");
			const customFetch = mockFetch();
			const constructorFetch = vi.fn(() => {
				throw new Error("Per-call fetch must override constructor fetch");
			});
			const client = new InferenceClient(
				"",
				mode === "constructor" ? { fetch: customFetch } : mode === "override" ? { fetch: constructorFetch } : {},
			);

			const result = await client.textClassification(
				{ provider: "hf-inference", inputs: "hello", ...(explicitModel ? { model: "test/model" } : {}) },
				mode === "constructor" ? {} : { fetch: customFetch },
			);

			expect(result).toEqual(output);
			expect(globalFetch).not.toHaveBeenCalled();
			expect(constructorFetch).not.toHaveBeenCalled();
			expect(customFetch.mock.calls.map(([input]) => new URL(requestUrl(input)).pathname)).toEqual([
				...(explicitModel ? [] : ["/api/tasks"]),
				"/api/models/test/model",
				"/hf-inference/models/test/model",
			]);
		});
	});

	it("preserves global fetch fallback and cached task discovery", async () => {
		vi.resetModules();
		const globalFetch = mockFetch();
		vi.stubGlobal("fetch", globalFetch);
		const { InferenceClient } = await import("../src/index.js");
		const client = new InferenceClient("");
		for (let i = 0; i < 2; i++) {
			expect(await client.textClassification({ provider: "hf-inference", inputs: "hello" })).toEqual(output);
		}
		expect(
			globalFetch.mock.calls.filter(([input]) => new URL(requestUrl(input)).pathname === "/api/tasks"),
		).toHaveLength(1);
	});

	it("preserves custom fetch for auto provider mapping and inference", async () => {
		vi.resetModules();
		const globalFetch = vi.fn(() => {
			throw new Error("Unexpected global fetch");
		});
		vi.stubGlobal("fetch", globalFetch);
		const { InferenceClient } = await import("../src/index.js");
		const customFetch = mockFetch();
		const result = await new InferenceClient("", { fetch: customFetch }).textClassification({
			provider: "auto",
			model: "test/model",
			inputs: "hello",
		});
		expect(result).toEqual(output);
		expect(customFetch).toHaveBeenCalledTimes(2);
		expect(globalFetch).not.toHaveBeenCalled();
	});

	it("still requires a model for the auto provider", async () => {
		vi.resetModules();
		const customFetch = mockFetch();
		vi.stubGlobal("fetch", customFetch);
		const { InferenceClient } = await import("../src/index.js");
		await expect(
			new InferenceClient("", { fetch: customFetch }).textClassification({ provider: "auto", inputs: "hello" }),
		).rejects.toThrow("Specifying a model is required");
		expect(customFetch).not.toHaveBeenCalled();
	});
});
