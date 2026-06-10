import type { ChatCompletionInput, ChatCompletionOutput, TextToSpeechInput } from "@huggingface/tasks";
import { describe, expect, it } from "vitest";
import { MiniMaxConversationalTask, MiniMaxTextToSpeechTask } from "../src/providers/minimax.js";
import { HARDCODED_MODEL_INFERENCE_MAPPING } from "../src/providers/consts.js";
import { INFERENCE_PROVIDERS, PROVIDERS_HUB_ORGS } from "../src/types.js";
import type { BaseArgs } from "../src/types.js";
import { PROVIDERS, getProviderHelper } from "../src/lib/getProviderHelper.js";

describe("MiniMax Provider", () => {
	// ==================== Registration Tests ====================

	describe("provider registration", () => {
		it("should be listed in INFERENCE_PROVIDERS", () => {
			expect(INFERENCE_PROVIDERS).toContain("minimax");
		});

		it("should have a hub org mapping", () => {
			expect(PROVIDERS_HUB_ORGS).toHaveProperty("minimax");
			expect(PROVIDERS_HUB_ORGS["minimax"]).toBe("minimax");
		});

		it("should have a hardcoded model inference mapping entry", () => {
			expect(HARDCODED_MODEL_INFERENCE_MAPPING).toHaveProperty("minimax");
		});

		it("should be registered in PROVIDERS map", () => {
			expect(PROVIDERS).toHaveProperty("minimax");
			expect(PROVIDERS["minimax"]).toHaveProperty("conversational");
			expect(PROVIDERS["minimax"]).toHaveProperty("text-to-speech");
		});

		it("should return conversational helper via getProviderHelper", () => {
			const helper = getProviderHelper("minimax", "conversational");
			expect(helper).toBeInstanceOf(MiniMaxConversationalTask);
		});

		it("should return TTS helper via getProviderHelper", () => {
			const helper = getProviderHelper("minimax", "text-to-speech");
			expect(helper).toBeInstanceOf(MiniMaxTextToSpeechTask);
		});
	});

	// ==================== Conversational Task Tests ====================

	describe("MiniMaxConversationalTask", () => {
		const task = new MiniMaxConversationalTask();

		it("should use correct provider name", () => {
			expect(task.provider).toBe("minimax");
		});

		it("should use clientSideRoutingOnly", () => {
			expect(task.clientSideRoutingOnly).toBe(true);
		});

		it("should use correct base URL for provider-key auth", () => {
			const url = task.makeBaseUrl({ authMethod: "provider-key", model: "MiniMax-M2.7" });
			expect(url).toBe("https://api.minimax.io");
		});

		it("should use correct route", () => {
			const route = task.makeRoute();
			expect(route).toBe("v1/chat/completions");
		});

		it("should build correct full URL", () => {
			const url = task.makeUrl({ authMethod: "provider-key", model: "MiniMax-M2.7" });
			expect(url).toBe("https://api.minimax.io/v1/chat/completions");
		});

		it("should prepare payload with model", () => {
			const payload = task.preparePayload({
				args: {
					messages: [{ role: "user", content: "Hello" }],
				} as ChatCompletionInput,
				model: "MiniMax-M2.7",
			});
			expect(payload).toHaveProperty("model", "MiniMax-M2.7");
			expect(payload).toHaveProperty("messages");
		});

		it("should clamp temperature=0 to 0.01", () => {
			const payload = task.preparePayload({
				args: {
					messages: [{ role: "user", content: "Hello" }],
					temperature: 0,
				} as ChatCompletionInput,
				model: "MiniMax-M2.7",
			});
			expect(payload.temperature).toBe(0.01);
		});

		it("should clamp negative temperature to 0.01", () => {
			const payload = task.preparePayload({
				args: {
					messages: [{ role: "user", content: "Hello" }],
					temperature: -0.5,
				} as ChatCompletionInput,
				model: "MiniMax-M2.7",
			});
			expect(payload.temperature).toBe(0.01);
		});

		it("should preserve valid temperature", () => {
			const payload = task.preparePayload({
				args: {
					messages: [{ role: "user", content: "Hello" }],
					temperature: 0.7,
				} as ChatCompletionInput,
				model: "MiniMax-M2.7",
			});
			expect(payload.temperature).toBe(0.7);
		});

		it("should remove response_format from payload", () => {
			const payload = task.preparePayload({
				args: {
					messages: [{ role: "user", content: "Hello" }],
					response_format: { type: "json_object" },
				} as ChatCompletionInput,
				model: "MiniMax-M2.7",
			});
			expect(payload).not.toHaveProperty("response_format");
		});

		it("should validate correct ChatCompletionOutput", async () => {
			const validResponse = {
				id: "chatcmpl-123",
				object: "chat.completion",
				created: 1677652288,
				model: "MiniMax-M2.7",
				system_fingerprint: "",
				choices: [
					{
						index: 0,
						message: { role: "assistant", content: "Hello!" },
						finish_reason: "stop",
					},
				],
				usage: { prompt_tokens: 9, completion_tokens: 12, total_tokens: 21 },
			} as unknown as ChatCompletionOutput;
			const result = await task.getResponse(validResponse);
			expect(result).toEqual(validResponse);
		});

		it("should reject invalid response", async () => {
			await expect(
				task.getResponse({ invalid: true } as unknown as ChatCompletionOutput)
			).rejects.toThrow("Expected ChatCompletionOutput");
		});

		it("should prepare headers with Bearer auth", () => {
			const headers = task.prepareHeaders({ accessToken: "test-key", authMethod: "provider-key" }, false);
			expect(headers["Authorization"]).toBe("Bearer test-key");
			expect(headers["Content-Type"]).toBe("application/json");
		});
	});

	// ==================== TTS Task Tests ====================

	describe("MiniMaxTextToSpeechTask", () => {
		const task = new MiniMaxTextToSpeechTask();

		it("should use correct provider name", () => {
			expect(task.provider).toBe("minimax");
		});

		it("should use clientSideRoutingOnly", () => {
			expect(task.clientSideRoutingOnly).toBe(true);
		});

		it("should use correct TTS route", () => {
			const route = task.makeRoute();
			expect(route).toBe("v1/t2a_v2");
		});

		it("should build correct TTS URL", () => {
			const url = task.makeUrl({ authMethod: "provider-key", model: "speech-2.8-hd" });
			expect(url).toBe("https://api.minimax.io/v1/t2a_v2");
		});

		it("should prepare TTS payload with default model", () => {
			const payload = task.preparePayload({
				args: {
					inputs: "Hello world",
				} as TextToSpeechInput & BaseArgs,
				model: "",
			});
			expect(payload).toHaveProperty("model", "speech-2.8-hd");
			expect(payload).toHaveProperty("text", "Hello world");
			expect(payload).toHaveProperty("voice_setting");
			expect(payload).toHaveProperty("audio_setting");
		});

		it("should use provided model for TTS payload", () => {
			const payload = task.preparePayload({
				args: {
					inputs: "Hello world",
				} as TextToSpeechInput & BaseArgs,
				model: "speech-2.8-turbo",
			});
			expect(payload).toHaveProperty("model", "speech-2.8-turbo");
		});

		it("should decode hex-encoded audio response to Blob", async () => {
			// "48656c6c6f" is hex for "Hello"
			const response = {
				data: { audio: "48656c6c6f" },
				base_resp: { status_code: 0, status_msg: "success" },
			};
			const blob = await task.getResponse(response);
			expect(blob).toBeInstanceOf(Blob);
			expect(blob.type).toBe("audio/mpeg");
			expect(blob.size).toBe(5);
		});

		it("should throw on API error response", async () => {
			const errorResponse = {
				data: { audio: "" },
				base_resp: { status_code: 2013, status_msg: "Invalid voice_id" },
			};
			await expect(task.getResponse(errorResponse)).rejects.toThrow("MiniMax TTS API error");
		});

		it("should throw on malformed response", async () => {
			await expect(task.getResponse({ unexpected: true })).rejects.toThrow("malformed response");
		});

		it("should throw on empty audio data", async () => {
			const response = {
				data: { audio: "" },
				base_resp: { status_code: 0, status_msg: "success" },
			};
			await expect(task.getResponse(response)).rejects.toThrow("malformed response");
		});
	});

	// ==================== Integration Tests ====================

	describe("integration tests", () => {
		const MINIMAX_API_KEY = process.env.MINIMAX_API_KEY;
		const skipIntegration = !MINIMAX_API_KEY;

		it.skipIf(skipIntegration)("should complete chat via MiniMax API", async () => {
			const task = new MiniMaxConversationalTask();

			const payload = task.preparePayload({
				args: {
					messages: [{ role: "user", content: "Say hello in exactly one word." }],
					max_tokens: 32,
				} as ChatCompletionInput,
				model: "MiniMax-M2.7",
			});

			const url = task.makeUrl({ authMethod: "provider-key", model: "MiniMax-M2.7" });
			const headers = task.prepareHeaders({ accessToken: MINIMAX_API_KEY!, authMethod: "provider-key" }, false);

			const response = await fetch(url, {
				method: "POST",
				headers,
				body: JSON.stringify(payload),
			});

			expect(response.ok).toBe(true);
			const data = await response.json();
			const result = await task.getResponse(data);
			expect(result.choices).toBeDefined();
			expect(result.choices.length).toBeGreaterThan(0);
			expect(result.choices[0].message.content).toBeTruthy();
		}, 30_000);

		it.skipIf(skipIntegration)("should complete chat with MiniMax-M2.7-highspeed", async () => {
			const task = new MiniMaxConversationalTask();

			const payload = task.preparePayload({
				args: {
					messages: [{ role: "user", content: "Reply with the word 'pong'." }],
					max_tokens: 16,
				} as ChatCompletionInput,
				model: "MiniMax-M2.7-highspeed",
			});

			const url = task.makeUrl({ authMethod: "provider-key", model: "MiniMax-M2.7-highspeed" });
			const headers = task.prepareHeaders({ accessToken: MINIMAX_API_KEY!, authMethod: "provider-key" }, false);

			const response = await fetch(url, {
				method: "POST",
				headers,
				body: JSON.stringify(payload),
			});

			expect(response.ok).toBe(true);
			const data = await response.json();
			const result = await task.getResponse(data);
			expect(result.choices[0].message.content).toBeTruthy();
		}, 30_000);

		it.skipIf(skipIntegration)("should synthesize speech via MiniMax TTS API", async () => {
			const task = new MiniMaxTextToSpeechTask();

			const payload = task.preparePayload({
				args: {
					inputs: "Hello, this is a test.",
				} as TextToSpeechInput & BaseArgs,
				model: "speech-2.8-hd",
			});

			const url = task.makeUrl({ authMethod: "provider-key", model: "speech-2.8-hd" });
			const headers = task.prepareHeaders({ accessToken: MINIMAX_API_KEY!, authMethod: "provider-key" }, false);

			const response = await fetch(url, {
				method: "POST",
				headers,
				body: JSON.stringify(payload),
			});

			expect(response.ok).toBe(true);
			const data = await response.json();
			const blob = await task.getResponse(data);
			expect(blob).toBeInstanceOf(Blob);
			expect(blob.size).toBeGreaterThan(100);
			expect(blob.type).toBe("audio/mpeg");
		}, 30_000);
	});
});
