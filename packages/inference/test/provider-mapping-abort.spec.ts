import { afterEach, describe, expect, it, vi } from "vitest";
import { InferenceClient } from "../src/InferenceClient.js";
import { inferenceProviderMappingCache } from "../src/lib/getInferenceProviderMapping.js";

const model = "test/provider-mapping-abort";
const mapping = {
	inferenceProviderMapping: [
		{ provider: "hf-inference", hfModelId: model, providerId: model, status: "live", task: "text-classification" },
	],
};

function deferred<T>() {
	let resolve: (value: T) => void = () => {};
	const promise = new Promise<T>((resolvePromise) => {
		resolve = resolvePromise;
	});
	return { promise, resolve };
}

describe("provider mapping abort signal", () => {
	afterEach(() => {
		inferenceProviderMappingCache.clear();
	});

	it.each([
		{ provider: "auto" as const, alreadyAborted: false },
		{ provider: "hf-inference" as const, alreadyAborted: false },
		{ provider: "auto" as const, alreadyAborted: true },
		{ provider: "hf-inference" as const, alreadyAborted: true },
	])(
		"aborts the mapping fetch for $provider (already aborted: $alreadyAborted)",
		async ({ provider, alreadyAborted }) => {
			const controller = new AbortController();
			const started = deferred<void>();
			const response = deferred<Response>();
			const fetchMock = vi.fn<Parameters<typeof fetch>, ReturnType<typeof fetch>>(async (url, init) => {
				if (!String(url).includes("/api/models/")) {
					return new Response(JSON.stringify([{ label: "positive", score: 1 }]));
				}
				const pending = new Promise<Response>((resolve, reject) => {
					if (init?.signal?.aborted) {
						reject(init.signal.reason);
					} else {
						init?.signal?.addEventListener("abort", () => reject(init.signal?.reason), { once: true });
						void response.promise.then(resolve);
					}
				});
				started.resolve();
				return pending;
			});
			if (alreadyAborted) {
				controller.abort();
			}
			let outcome: unknown;
			const request = new InferenceClient()
				.textClassification({ model, provider, inputs: "hello" }, { signal: controller.signal, fetch: fetchMock })
				.then(
					() => {
						outcome = "completed";
					},
					(error: unknown) => {
						outcome = error;
					},
				);

			try {
				await started.promise;
				controller.abort();
				// Let the abort rejection propagate without releasing the pending HTTP response.
				await new Promise((resolve) => setTimeout(resolve, 0));
				expect(outcome).toBe(controller.signal.reason);
				expect(fetchMock).toHaveBeenCalledTimes(1);
				expect(inferenceProviderMappingCache.has(model)).toBe(false);
			} finally {
				response.resolve(new Response(JSON.stringify(mapping)));
				await request;
			}
		},
	);

	it.each(["auto", "hf-inference"] as const)(
		"preserves abort errors while reading %s mapping JSON",
		async (provider) => {
			const controller = new AbortController();
			const reading = deferred<void>();
			let finishBody = () => {};
			const fetchMock = vi.fn<Parameters<typeof fetch>, ReturnType<typeof fetch>>(async (url, init) => {
				if (!String(url).includes("/api/models/")) {
					return new Response(JSON.stringify([{ label: "positive", score: 1 }]));
				}
				const body = new ReadableStream<Uint8Array>({
					start(bodyController) {
						bodyController.enqueue(new TextEncoder().encode('{"inferenceProviderMapping":'));
						init?.signal?.addEventListener("abort", () => bodyController.error(init.signal?.reason), { once: true });
						finishBody = () => {
							if (!init?.signal?.aborted) {
								bodyController.enqueue(
									new TextEncoder().encode(JSON.stringify(mapping.inferenceProviderMapping) + "}"),
								);
								bodyController.close();
							}
						};
					},
					pull() {
						reading.resolve();
					},
				});
				return new Response(body, { headers: { "Content-Type": "application/json" } });
			});
			let outcome: unknown;
			const request = new InferenceClient()
				.textClassification({ model, provider, inputs: "hello" }, { signal: controller.signal, fetch: fetchMock })
				.catch((error: unknown) => {
					outcome = error;
				});

			try {
				await reading.promise;
				controller.abort();
				await new Promise((resolve) => setTimeout(resolve, 0));
				expect(outcome).toBe(controller.signal.reason);
				expect(fetchMock).toHaveBeenCalledTimes(1);
				expect(inferenceProviderMappingCache.has(model)).toBe(false);
			} finally {
				finishBody();
				await request;
			}
		},
	);
});
