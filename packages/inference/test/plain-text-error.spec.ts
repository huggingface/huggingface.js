import { describe, expect, it, vi } from "vitest";
import { InferenceClient } from "../src/InferenceClient.js";

describe("plain-text provider errors", () => {
	it.each(["text/plain", "text/plain; charset=utf-8", "TEXT/PLAIN ; charset=UTF-8"])(
		"preserves an error body for Content-Type %s",
		async (contentType) => {
			const fetchMock = vi.fn<Parameters<typeof fetch>, ReturnType<typeof fetch>>(() =>
				Promise.resolve(
					new Response("provider quota exceeded", {
						status: 429,
						headers: { "Content-Type": contentType, "x-request-id": "request-id" },
					}),
				),
			);
			const client = new InferenceClient("", {
				endpointUrl: "https://example.com/inference",
				fetch: fetchMock,
			});

			await expect(client.textGeneration({ inputs: "Hello" })).rejects.toMatchObject({
				message: "Failed to perform inference: provider quota exceeded",
				httpResponse: {
					body: "provider quota exceeded",
					requestId: "request-id",
					status: 429,
				},
			});
			expect(fetchMock).toHaveBeenCalledOnce();
		},
	);

	it("does not treat a prefixed subtype as plain text", async () => {
		const fetchMock = vi.fn<Parameters<typeof fetch>, ReturnType<typeof fetch>>(() =>
			Promise.resolve(
				new Response("provider quota exceeded", {
					status: 429,
					headers: { "Content-Type": "text/plaintext", "x-request-id": "request-id" },
				}),
			),
		);
		const client = new InferenceClient("", {
			endpointUrl: "https://example.com/inference",
			fetch: fetchMock,
		});

		await expect(client.textGeneration({ inputs: "Hello" })).rejects.toMatchObject({
			message: "Failed to perform inference: an HTTP error occurred when requesting the provider",
			httpResponse: {
				body: "",
				requestId: "request-id",
				status: 429,
			},
		});
		expect(fetchMock).toHaveBeenCalledOnce();
	});
});
