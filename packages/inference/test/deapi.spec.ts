import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";

import { InferenceClient } from "../src/index.js";
import { HARDCODED_MODEL_INFERENCE_MAPPING } from "../src/providers/consts.js";

/**
 * Offline unit/contract tests for the deAPI provider.
 *
 * Unlike the live integration block in InferenceClient.spec.ts (which sits under
 * describe.skip and requires real keys), these run on every `pnpm test`. We stub the global
 * `fetch` (used both by innerRequest and by the asset download in getResponse) and inject a
 * hardcoded model mapping, so no network or credentials are needed.
 */

const IMAGE_CDN_URL = "https://cdn.deapi.ai/out.png";

interface RecordedCall {
	url: string;
	init: RequestInit;
}

function jsonResponse(obj: unknown): Response {
	return new Response(JSON.stringify(obj), { status: 200, headers: { "Content-Type": "application/json" } });
}

function blobResponse(bytes: Uint8Array, type = "image/png"): Response {
	return new Response(bytes, { status: 200, headers: { "Content-Type": type } });
}

/** Install a global fetch mock that routes by URL and records every call for assertions. */
function installFetchMock(): { calls: RecordedCall[] } {
	const calls: RecordedCall[] = [];
	const fetchMock = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
		const url = String(input);
		calls.push({ url, init: init ?? {} });
		if (url.includes("/v1/images/generations") || url.includes("/v1/images/edits")) {
			return jsonResponse({ data: [{ url: IMAGE_CDN_URL }] });
		}
		if (url === IMAGE_CDN_URL) {
			return blobResponse(new Uint8Array([1, 2, 3, 4]), "image/png");
		}
		if (url.includes("/v1/embeddings")) {
			return jsonResponse({
				data: [{ embedding: [0.1, 0.2, 0.3], index: 0, object: "embedding" }],
				model: "x",
				object: "list",
			});
		}
		if (url.includes("/v1/audio/transcriptions")) {
			return jsonResponse({ text: "hello world" });
		}
		if (url.includes("/v1/audio/speech")) {
			return blobResponse(new Uint8Array([5, 6, 7]), "audio/mpeg");
		}
		throw new Error(`Unexpected fetch URL in deAPI test: ${url}`);
	};
	vi.stubGlobal("fetch", fetchMock);
	return { calls };
}

function requireCall(calls: RecordedCall[], fragment: string): RecordedCall {
	const call = calls.find((c) => c.url.includes(fragment));
	if (!call) {
		throw new Error(`Expected a request to a URL containing "${fragment}"`);
	}
	return call;
}

function headerValue(init: RequestInit, name: string): string | undefined {
	const headers = init.headers as Record<string, string> | undefined;
	if (!headers) {
		return undefined;
	}
	const key = Object.keys(headers).find((k) => k.toLowerCase() === name.toLowerCase());
	return key ? headers[key] : undefined;
}

describe("deAPI provider (offline, mocked fetch)", () => {
	beforeAll(() => {
		HARDCODED_MODEL_INFERENCE_MAPPING["deapi"] = {
			"black-forest-labs/FLUX.1-schnell": {
				provider: "deapi",
				hfModelId: "black-forest-labs/FLUX.1-schnell",
				providerId: "Flux1schnell",
				status: "live",
				task: "text-to-image",
			},
			"black-forest-labs/FLUX.2-klein-4B": {
				provider: "deapi",
				hfModelId: "black-forest-labs/FLUX.2-klein-4B",
				providerId: "Flux_2_Klein_4B_BF16",
				status: "live",
				task: "image-to-image",
			},
			"BAAI/bge-m3": {
				provider: "deapi",
				hfModelId: "BAAI/bge-m3",
				providerId: "Bge_M3_FP16",
				status: "live",
				task: "feature-extraction",
			},
			"openai/whisper-large-v3": {
				provider: "deapi",
				hfModelId: "openai/whisper-large-v3",
				providerId: "WhisperLargeV3",
				status: "live",
				task: "automatic-speech-recognition",
			},
		};
	});

	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it("text-to-image: provider-key calls oai.deapi.ai directly with a Bearer key and url response_format", async () => {
		const { calls } = installFetchMock();
		const client = new InferenceClient("dpn-sk-test");
		const res = await client.textToImage({
			provider: "deapi",
			model: "black-forest-labs/FLUX.1-schnell",
			inputs: "a tortoise",
		});
		expect(res).toBeInstanceOf(Blob);

		const apiCall = requireCall(calls, "/v1/images/generations");
		expect(apiCall.url).toBe("https://oai.deapi.ai/v1/images/generations");
		expect(headerValue(apiCall.init, "Authorization")).toBe("Bearer dpn-sk-test");
		const body = JSON.parse(apiCall.init.body as string);
		expect(body).toMatchObject({ model: "Flux1schnell", prompt: "a tortoise", response_format: "url" });
	});

	it("text-to-image: HF token routes through router.huggingface.co/deapi", async () => {
		const { calls } = installFetchMock();
		const client = new InferenceClient("hf_test");
		await client.textToImage({ provider: "deapi", model: "black-forest-labs/FLUX.1-schnell", inputs: "a tortoise" });
		const apiCall = requireCall(calls, "/v1/images/generations");
		expect(apiCall.url).toBe("https://router.huggingface.co/deapi/v1/images/generations");
	});

	it("text-to-image: outputType 'url' returns the hosted URL without fetching bytes", async () => {
		const { calls } = installFetchMock();
		const client = new InferenceClient("dpn-sk-test");
		const res = await client.textToImage(
			{ provider: "deapi", model: "black-forest-labs/FLUX.1-schnell", inputs: "x" },
			{ outputType: "url" },
		);
		expect(res).toBe(IMAGE_CDN_URL);
		expect(calls.find((c) => c.url === IMAGE_CDN_URL)).toBeUndefined();
	});

	it("image-to-image: completes end-to-end (regression for the two-phase makeRequestOptions flow)", async () => {
		const { calls } = installFetchMock();
		const client = new InferenceClient("dpn-sk-test");
		const res = await client.imageToImage({
			provider: "deapi",
			model: "black-forest-labs/FLUX.2-klein-4B",
			inputs: new Blob([new Uint8Array([9, 9, 9])], { type: "image/png" }),
			parameters: { prompt: "make it a tiger" },
		});
		expect(res).toBeInstanceOf(Blob);

		const apiCall = requireCall(calls, "/v1/images/edits");
		expect(apiCall.url).toBe("https://oai.deapi.ai/v1/images/edits");
		// multipart: we must NOT set Content-Type ourselves (runtime adds the boundary).
		expect(headerValue(apiCall.init, "Content-Type")).toBeUndefined();
		expect(apiCall.init.body).toBeInstanceOf(FormData);
	});

	it("image-to-image: rejects inpainting (mask) client-side", async () => {
		installFetchMock();
		const client = new InferenceClient("dpn-sk-test");
		await expect(
			client.imageToImage({
				provider: "deapi",
				model: "black-forest-labs/FLUX.2-klein-4B",
				inputs: new Blob([new Uint8Array([1])], { type: "image/png" }),
				parameters: { prompt: "edit", mask: "x" },
			}),
		).rejects.toThrow(/inpainting|mask/i);
	});

	it("feature-extraction: returns embeddings as number[][]", async () => {
		const { calls } = installFetchMock();
		const client = new InferenceClient("dpn-sk-test");
		const res = await client.featureExtraction({ provider: "deapi", model: "BAAI/bge-m3", inputs: "hello" });
		expect(res).toEqual([[0.1, 0.2, 0.3]]);
		const apiCall = requireCall(calls, "/v1/embeddings");
		expect(JSON.parse(apiCall.init.body as string)).toMatchObject({ model: "Bge_M3_FP16", input: "hello" });
	});

	it("automatic-speech-recognition: sends multipart and forces JSON, returns { text }", async () => {
		const { calls } = installFetchMock();
		const client = new InferenceClient("dpn-sk-test");
		const res = await client.automaticSpeechRecognition({
			provider: "deapi",
			model: "openai/whisper-large-v3",
			data: new Blob([new Uint8Array([1, 2, 3])], { type: "audio/flac" }),
		});
		expect(res).toEqual({ text: "hello world" });

		const apiCall = requireCall(calls, "/v1/audio/transcriptions");
		expect(apiCall.url).toBe("https://oai.deapi.ai/v1/audio/transcriptions");
		expect(headerValue(apiCall.init, "Content-Type")).toBeUndefined();
		expect(apiCall.init.body).toBeInstanceOf(FormData);
	});

	it("automatic-speech-recognition: rejects audio larger than 20 MB before any request", async () => {
		const { calls } = installFetchMock();
		const client = new InferenceClient("dpn-sk-test");
		const tooBig = new Blob([new Uint8Array(20 * 1024 * 1024 + 1)], { type: "audio/wav" });
		await expect(
			client.automaticSpeechRecognition({ provider: "deapi", model: "openai/whisper-large-v3", data: tooBig }),
		).rejects.toThrow(/20 MB|bytes/i);
		expect(calls.length).toBe(0);
	});
});
