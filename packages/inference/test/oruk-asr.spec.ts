import { afterEach, describe, expect, it, vi } from "vitest";
import { InferenceClient } from "../src/InferenceClient.js";
import { HARDCODED_MODEL_INFERENCE_MAPPING } from "../src/providers/consts.js";
import { OrukAutomaticSpeechRecognitionTask } from "../src/providers/oruk.js";

const MODEL = "Qwen/Qwen3-ASR-1.7B";

describe("Oruk provisional ASR provider", () => {
	afterEach(() => {
		HARDCODED_MODEL_INFERENCE_MAPPING.oruk = {};
	});

	function mockMapping(): void {
		// Test fixture only; not an assertion that a live HF mapping exists.
		HARDCODED_MODEL_INFERENCE_MAPPING.oruk = {
			[MODEL]: {
				provider: "oruk",
				hfModelId: MODEL,
				providerId: MODEL,
				status: "live",
				task: "automatic-speech-recognition",
			},
		};
	}

	for (const [key, host] of [
		["test-provider-key", "https://qwen3-asr.oruk.ai"],
		["hf_test_token", "https://router.huggingface.co/oruk"],
	]) {
		it(`preserves binary bytes and selects the correct origin for ${key.startsWith("hf_") ? "HF" : "provider"} authentication`, async () => {
			mockMapping();
			const bytes = new Uint8Array([0, 255, 128, 13, 10, 65]);
			const fetchMock = vi.fn<Parameters<typeof fetch>, ReturnType<typeof fetch>>(async (url, init) => {
				expect(url).toBe(`${host}/models/${MODEL}`);
				expect(init?.headers).toMatchObject({
					Authorization: `Bearer ${key}`,
					"Content-Type": "application/octet-stream",
				});
				expect(init?.body).toBeInstanceOf(Blob);
				expect(new Uint8Array(await (init?.body as Blob).arrayBuffer())).toEqual(bytes);
				return new Response(JSON.stringify({ text: "public fixture transcript" }), {
					headers: { "Content-Type": "application/json" },
				});
			});
			const client = new InferenceClient(key, { fetch: fetchMock });
			const result = await client.automaticSpeechRecognition({
				provider: "oruk",
				model: MODEL,
				inputs: new Blob([bytes]),
				parameters: { return_timestamps: false },
			});
			expect(result).toEqual({ text: "public fixture transcript" });
			expect(fetchMock).toHaveBeenCalledTimes(1);
		});
	}

	it("supports the legacy ArrayBuffer input and propagates abort signals", async () => {
		mockMapping();
		const controller = new AbortController();
		const fetchMock = vi.fn<Parameters<typeof fetch>, ReturnType<typeof fetch>>(async (_url, init) => {
			expect(init?.signal).toBe(controller.signal);
			return new Response(JSON.stringify({ text: "" }), { headers: { "Content-Type": "application/json" } });
		});
		const client = new InferenceClient("test-provider-key", { fetch: fetchMock });
		expect(
			await client.automaticSpeechRecognition(
				{ provider: "oruk", model: MODEL, data: new Uint8Array([1, 2]).buffer },
				{ signal: controller.signal },
			),
		).toEqual({ text: "" });
	});

	it("rejects unsupported parameters and URLs before network access", async () => {
		const task = new OrukAutomaticSpeechRecognitionTask();
		await expect(
			task.preparePayloadAsync({ model: MODEL, inputs: new Blob(["a"]), parameters: { return_timestamps: true } }),
		).rejects.toThrow(/timestamps/);
		await expect(
			task.preparePayloadAsync({
				model: MODEL,
				inputs: new Blob(["a"]),
				parameters: { generation_parameters: { do_sample: true } },
			}),
		).rejects.toThrow(/generation/);
		await expect(
			task.preparePayloadAsync({ model: MODEL, inputs: "https://example.com/private.wav" } as never),
		).rejects.toThrow(/URLs/);
		await expect(task.preparePayloadAsync({ model: MODEL, inputs: new Blob([]) })).rejects.toThrow(/25 MiB/);
		await expect(
			task.preparePayloadAsync({ model: MODEL, inputs: new Blob([new Uint8Array(25 * 1024 * 1024 + 1)]) }),
		).rejects.toThrow(/25 MiB/);
	});

	it("validates response shape without including response contents in errors", async () => {
		const task = new OrukAutomaticSpeechRecognitionTask();
		await expect(task.getResponse({ text: "hello", private: "discard" })).resolves.toEqual({ text: "hello" });
		await expect(task.getResponse({ private: "never print this" })).rejects.toThrow(/expected a text string/);
		await expect(task.getResponse(null)).rejects.not.toThrow(/never print/);
	});
});
