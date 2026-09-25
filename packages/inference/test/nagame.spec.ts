import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { InferenceClient } from "../src/InferenceClient.js";
import { InferenceClientProviderApiError, InferenceClientProviderOutputError } from "../src/errors.js";
import { getProviderHelper } from "../src/lib/getProviderHelper.js";
import { HARDCODED_MODEL_INFERENCE_MAPPING } from "../src/providers/consts.js";
import { INFERENCE_PROVIDERS, PROVIDERS_HUB_ORGS } from "../src/types.js";

const model = "test-org/test-chat-model";
const providerModel = "test-chat-model";
const originalMapping = HARDCODED_MODEL_INFERENCE_MAPPING.nagame;
const completion = {
	id: "chatcmpl-test",
	object: "chat.completion",
	created: 1,
	model: providerModel,
	choices: [{ index: 0, message: { role: "assistant", content: "Hello" }, finish_reason: "stop" }],
	usage: { prompt_tokens: 4, completion_tokens: 1, total_tokens: 5 },
};

function args() {
	return {
		provider: "nagame" as const,
		model,
		messages: [{ role: "user" as const, content: "Hi" }],
		max_tokens: 16,
	};
}

describe("Nagame", () => {
	beforeEach(() => {
		HARDCODED_MODEL_INFERENCE_MAPPING.nagame = {
			[model]: {
				provider: "nagame",
				hfModelId: model,
				providerId: providerModel,
				status: "live",
				task: "conversational",
			},
		};
		vi.stubGlobal(
			"fetch",
			vi.fn(() => {
				throw new Error("Unexpected network request");
			}),
		);
	});

	afterEach(() => {
		HARDCODED_MODEL_INFERENCE_MAPPING.nagame = originalMapping;
		vi.unstubAllGlobals();
	});

	it("registers conversational support and the Hub organization", () => {
		expect(INFERENCE_PROVIDERS).toContain("nagame");
		expect(PROVIDERS_HUB_ORGS.nagame).toBe("nagameai");
		expect(getProviderHelper("nagame", "conversational").provider).toBe("nagame");
		expect(() => getProviderHelper("nagame", "text-to-image")).toThrow();
	});

	it.each([
		["nagame-test-key", "https://api.nagame.ai/v1/chat/completions"],
		["hf_test_key", "https://router.huggingface.co/nagame/v1/chat/completions"],
	])("routes JSON requests using %s", async (accessToken, url) => {
		const fetchMock = vi.fn<Parameters<typeof fetch>, ReturnType<typeof fetch>>(() =>
			Promise.resolve(new Response(JSON.stringify(completion), { headers: { "Content-Type": "application/json" } })),
		);
		const client = new InferenceClient(accessToken, { fetch: fetchMock });
		const result = await client.chatCompletion(args());
		expect(result).toEqual(completion);
		expect(fetchMock).toHaveBeenCalledTimes(1);
		const [requestUrl, init] = fetchMock.mock.calls[0];
		expect(requestUrl).toBe(url);
		expect(init?.method).toBe("POST");
		expect(new Headers(init?.headers).get("Authorization")).toBe(`Bearer ${accessToken}`);
		expect(new Headers(init?.headers).get("Content-Type")).toBe("application/json");
		expect(JSON.parse(String(init?.body))).toMatchObject({
			model: providerModel,
			messages: args().messages,
			max_tokens: 16,
		});
	});

	it("preserves tool calling and structured output parameters", async () => {
		const fetchMock = vi.fn<Parameters<typeof fetch>, ReturnType<typeof fetch>>(() =>
			Promise.resolve(new Response(JSON.stringify(completion), { headers: { "Content-Type": "application/json" } })),
		);
		const parameters = {
			tools: [
				{ type: "function" as const, function: { name: "weather", parameters: { type: "object", properties: {} } } },
			],
			tool_choice: { type: "function" as const, function: { name: "weather" } },
			response_format: {
				type: "json_schema" as const,
				json_schema: { name: "answer", schema: { type: "object", properties: {} } },
			},
		};
		await new InferenceClient("nagame-test-key", { fetch: fetchMock }).chatCompletion({ ...args(), ...parameters });
		expect(JSON.parse(String(fetchMock.mock.calls[0][1]?.body))).toMatchObject(parameters);
	});

	it.each([
		["nagame-test-key", "https://api.nagame.ai/v1/chat/completions"],
		["hf_test_key", "https://router.huggingface.co/nagame/v1/chat/completions"],
	])("reads SSE chunks and terminates at DONE using %s", async (accessToken, url) => {
		const chunk = {
			id: completion.id,
			object: "chat.completion.chunk",
			created: 1,
			model: providerModel,
			choices: [{ index: 0, delta: { role: "assistant", content: "Hello" }, finish_reason: null }],
		};
		const finalChunk = { ...chunk, choices: [{ index: 0, delta: {}, finish_reason: "stop" }], usage: completion.usage };
		const fetchMock = vi.fn<Parameters<typeof fetch>, ReturnType<typeof fetch>>(() =>
			Promise.resolve(
				new Response(`data: ${JSON.stringify(chunk)}\n\ndata: ${JSON.stringify(finalChunk)}\n\ndata: [DONE]\n\n`, {
					headers: { "Content-Type": "text/event-stream" },
				}),
			),
		);
		const chunks = [];
		for await (const event of new InferenceClient(accessToken, { fetch: fetchMock }).chatCompletionStream(args())) {
			chunks.push(event);
		}
		expect(chunks).toEqual([chunk, finalChunk]);
		expect(fetchMock).toHaveBeenCalledTimes(1);
		expect(fetchMock.mock.calls[0][0]).toBe(url);
		expect(JSON.parse(String(fetchMock.mock.calls[0][1]?.body))).toMatchObject({ model: providerModel, stream: true });
	});

	it("surfaces provider errors", async () => {
		const fetchMock = vi.fn<Parameters<typeof fetch>, ReturnType<typeof fetch>>(() =>
			Promise.resolve(
				new Response(
					JSON.stringify({
						error: { message: "Request capacity is full", type: "rate_limit_error", code: "queue_full" },
					}),
					{ status: 429, headers: { "Content-Type": "application/json" } },
				),
			),
		);
		await expect(
			new InferenceClient("nagame-test-key", { fetch: fetchMock }).chatCompletion(args()),
		).rejects.toBeInstanceOf(InferenceClientProviderApiError);
	});

	it("rejects malformed completion responses", async () => {
		const fetchMock = vi.fn<Parameters<typeof fetch>, ReturnType<typeof fetch>>(() =>
			Promise.resolve(
				new Response(JSON.stringify({ text: "not a chat completion" }), {
					headers: { "Content-Type": "application/json" },
				}),
			),
		);
		await expect(
			new InferenceClient("nagame-test-key", { fetch: fetchMock }).chatCompletion(args()),
		).rejects.toBeInstanceOf(InferenceClientProviderOutputError);
	});
});
