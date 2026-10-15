import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { InferenceClient } from "../src/InferenceClient.js";
import { InferenceClientProviderOutputError } from "../src/errors.js";
import { inferenceProviderMappingCache } from "../src/lib/getInferenceProviderMapping.js";
import { getProviderHelper } from "../src/lib/getProviderHelper.js";
import { HARDCODED_MODEL_INFERENCE_MAPPING } from "../src/providers/consts.js";
import { RuvilabConversationalTask } from "../src/providers/ruvilab.js";
import { INFERENCE_PROVIDERS, PROVIDERS_HUB_ORGS } from "../src/types.js";

// All mappings and credentials below are test fixtures, not live provider configuration.
const model = "test-org/chat-model";
const providerModel = "test-chat-model";
const providerKey = "hfip_test_fixture.not-a-real-key";
const messages = [{ role: "user", content: "Hello" }];
const request = { provider: "ruvilab" as const, model, messages };
const usage = { prompt_tokens: 4, completion_tokens: 2, total_tokens: 6 };
const completion = {
	id: "chatcmpl-test",
	object: "chat.completion",
	created: 1,
	model: providerModel,
	choices: [{ index: 0, message: { role: "assistant", content: "Hello!" }, finish_reason: "stop" }],
	usage,
};

describe("Ruvilab", () => {
	beforeEach(() => {
		inferenceProviderMappingCache.set(model, [
			{ provider: "ruvilab", hfModelId: model, providerId: providerModel, task: "conversational", status: "live" },
		]);
		// Fail closed if a test accidentally attempts a real network request.
		vi.stubGlobal(
			"fetch",
			vi.fn(() => Promise.reject(new Error("Unexpected network request"))),
		);
	});

	afterEach(() => {
		inferenceProviderMappingCache.clear();
		vi.unstubAllGlobals();
	});

	it("registers only conversational inference without hardcoded model mappings", () => {
		expect(INFERENCE_PROVIDERS).toContain("ruvilab");
		expect(PROVIDERS_HUB_ORGS.ruvilab).toBe("ruvilab");
		expect(HARDCODED_MODEL_INFERENCE_MAPPING.ruvilab).toEqual({});
		expect(getProviderHelper("ruvilab", "conversational")).toBeInstanceOf(RuvilabConversationalTask);
		expect(() => getProviderHelper("ruvilab", "text-to-image")).toThrow();
	});

	it.each([
		[providerKey, "https://api.ruvilab.com/v1/chat/completions"],
		["hf_test_fixture", "https://router.huggingface.co/ruvilab/v1/chat/completions"],
	])("routes %s to the correct endpoint and keeps credentials out of the payload", async (key, endpoint) => {
		const fetchMock = vi.fn<Parameters<typeof fetch>, ReturnType<typeof fetch>>(async () => Response.json(completion));
		const client = new InferenceClient(key, { fetch: fetchMock });

		expect(await client.chatCompletion({ ...request, max_tokens: 32 })).toEqual(completion);
		expect(fetchMock).toHaveBeenCalledTimes(1);
		const [url, init] = fetchMock.mock.calls[0];
		expect(url).toBe(endpoint);
		expect(init?.method).toBe("POST");
		expect(new Headers(init?.headers).get("Authorization")).toBe(`Bearer ${key}`);
		expect(new Headers(init?.headers).get("Content-Type")).toBe("application/json");
		expect(JSON.parse(String(init?.body))).toEqual({ model: providerModel, messages, max_tokens: 32 });
		expect(String(init?.body)).not.toContain(key);
	});

	it("fetches model mappings without disclosing a provider key to the Hub", async () => {
		inferenceProviderMappingCache.clear();
		const fetchMock = vi
			.fn<Parameters<typeof fetch>, ReturnType<typeof fetch>>()
			.mockResolvedValueOnce(
				Response.json({
					inferenceProviderMapping: [
						{
							provider: "ruvilab",
							hfModelId: model,
							providerId: providerModel,
							task: "conversational",
							status: "live",
						},
					],
				}),
			)
			.mockResolvedValueOnce(Response.json(completion));

		await new InferenceClient(providerKey, { fetch: fetchMock }).chatCompletion(request);
		expect(fetchMock).toHaveBeenCalledTimes(2);
		const [url, init] = fetchMock.mock.calls[0];
		expect(url).toBe(`https://huggingface.co/api/models/${model}?expand[]=inferenceProviderMapping`);
		expect(new Headers(init?.headers).has("Authorization")).toBe(false);
	});

	it("forwards image messages, tool calling and structured-output options unchanged", async () => {
		const options = {
			messages: [
				{
					role: "user",
					content: [
						{ type: "text" as const, text: "Describe this image" },
						{ type: "image_url" as const, image_url: { url: "https://example.com/image.png" } },
					],
				},
			],
			tools: [{ type: "function" as const, function: { name: "describe", parameters: { type: "object" } } }],
			tool_choice: "auto" as const,
			response_format: {
				type: "json_schema" as const,
				json_schema: { name: "description", schema: { type: "object" } },
			},
			temperature: 0.2,
		};
		const fetchMock = vi.fn<Parameters<typeof fetch>, ReturnType<typeof fetch>>(async () => Response.json(completion));
		await new InferenceClient(providerKey, { fetch: fetchMock }).chatCompletion({ ...request, ...options });
		expect(JSON.parse(String(fetchMock.mock.calls[0][1]?.body))).toEqual({ model: providerModel, ...options });
	});

	it("yields SSE before the response closes and preserves usage and tool-call chunks", async () => {
		let streamController!: ReadableStreamDefaultController<Uint8Array>;
		const body = new ReadableStream<Uint8Array>({
			start(controller) {
				streamController = controller;
			},
		});
		const encode = (data: unknown) => new TextEncoder().encode(`data: ${JSON.stringify(data)}\n\n`);
		const chunk = {
			id: "chatcmpl-test",
			object: "chat.completion.chunk",
			created: 1,
			model: providerModel,
			choices: [{ index: 0, delta: { content: "Hello" }, finish_reason: null }],
		};
		const fetchMock = vi.fn<Parameters<typeof fetch>, ReturnType<typeof fetch>>(
			async () => new Response(body, { headers: { "Content-Type": "text/event-stream; charset=utf-8" } }),
		);
		const stream = new InferenceClient(providerKey, { fetch: fetchMock }).chatCompletionStream({
			...request,
			stream_options: { include_usage: true },
		});
		const first = stream.next();
		// Split an SSE event across transport chunks; leave the response open.
		const bytes = encode(chunk);
		streamController.enqueue(bytes.slice(0, 9));
		streamController.enqueue(bytes.slice(9));
		expect(await first).toEqual({ value: chunk, done: false });
		const toolChunk = {
			...chunk,
			choices: [
				{ index: 0, delta: { tool_calls: [{ index: 0, function: { arguments: "{}" } }] }, finish_reason: null },
			],
		};
		const usageChunk = { ...chunk, choices: [], usage };
		streamController.enqueue(encode(toolChunk));
		streamController.enqueue(encode(usageChunk));
		streamController.enqueue(new TextEncoder().encode("data: [DONE]\n\n"));
		streamController.close();
		expect(await stream.next()).toEqual({ value: toolChunk, done: false });
		expect(await stream.next()).toEqual({ value: usageChunk, done: false });
		expect((await stream.next()).done).toBe(true);
		expect(JSON.parse(String(fetchMock.mock.calls[0][1]?.body))).toEqual({
			model: providerModel,
			messages,
			stream: true,
			stream_options: { include_usage: true },
		});
	});

	it.each([401, 429, 503])("propagates HTTP %i errors with redacted authorization", async (status) => {
		const fetchMock = vi.fn<Parameters<typeof fetch>, ReturnType<typeof fetch>>(async () =>
			Response.json({ error: { message: "Request rejected", type: "provider_error" } }, { status }),
		);
		const client = new InferenceClient(providerKey, { fetch: fetchMock, retry_on_error: false });
		await expect(client.chatCompletion(request)).rejects.toMatchObject({
			name: "ProviderApiError",
			httpRequest: { headers: { Authorization: "Bearer [redacted]" } },
			httpResponse: { status },
		});
		expect(fetchMock).toHaveBeenCalledTimes(1);
	});

	it("propagates errors inside an SSE response", async () => {
		const fetchMock = vi.fn<Parameters<typeof fetch>, ReturnType<typeof fetch>>(
			async () =>
				new Response('data: {"error":{"message":"Backend unavailable"}}\n\n', {
					headers: { "Content-Type": "text/event-stream" },
				}),
		);
		const stream = new InferenceClient(providerKey, { fetch: fetchMock }).chatCompletionStream(request);
		await expect(stream.next()).rejects.toThrow("Backend unavailable");
	});

	it("passes cancellation to the provider fetch", async () => {
		const controller = new AbortController();
		controller.abort();
		const fetchMock = vi.fn<Parameters<typeof fetch>, ReturnType<typeof fetch>>(async (_url, init) => {
			expect(init?.signal).toBe(controller.signal);
			init?.signal?.throwIfAborted();
			return Response.json(completion);
		});
		const client = new InferenceClient(providerKey, { fetch: fetchMock });
		await expect(client.chatCompletion(request, { signal: controller.signal })).rejects.toThrow(/abort/i);
		expect(fetchMock).toHaveBeenCalledTimes(1);
	});

	it("rejects malformed completion responses", async () => {
		const fetchMock = vi.fn<Parameters<typeof fetch>, ReturnType<typeof fetch>>(async () =>
			Response.json({ choices: [] }),
		);
		await expect(new InferenceClient(providerKey, { fetch: fetchMock }).chatCompletion(request)).rejects.toBeInstanceOf(
			InferenceClientProviderOutputError,
		);
	});
});
