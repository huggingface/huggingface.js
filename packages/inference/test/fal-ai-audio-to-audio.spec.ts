import { afterEach, describe, expect, it, vi } from "vitest";
import { InferenceClientProviderOutputError } from "../src/errors.js";
import { FalAIAudioToAudioTask } from "../src/providers/fal-ai.js";
import { base64FromBytes } from "../src/utils/base64FromBytes.js";

const itWithFakeTimers = typeof window !== "undefined" && typeof window.document !== "undefined" ? it.skip : it;

describe("FalAIAudioToAudioTask", () => {
	afterEach(() => {
		vi.unstubAllGlobals();
		vi.useRealTimers();
	});

	itWithFakeTimers("returns audio output after queue completes", async () => {
		vi.useFakeTimers();
		const audioBytes = new Uint8Array([1, 2, 3, 4]);
		const audioBlob = new Blob([audioBytes], { type: "audio/x-wav" });

		const fetchMock = vi.fn<Parameters<typeof fetch>, ReturnType<typeof fetch>>((url) => {
			const urlStr = String(url);
			if (urlStr.includes("/status")) {
				return Promise.resolve(new Response(JSON.stringify({ status: "COMPLETED" })));
			}
			if (urlStr.includes("cdn.example.com")) {
				return Promise.resolve(new Response(audioBlob, { headers: { "Content-Type": "audio/x-wav" } }));
			}
			return Promise.resolve(
				new Response(
					JSON.stringify({
						audio: { url: "https://cdn.example.com/audio.wav", content_type: "audio/x-wav" },
						text: "vocals",
					}),
				),
			);
		});
		vi.stubGlobal("fetch", fetchMock);

		const task = new FalAIAudioToAudioTask();
		const responsePromise = task.getResponse(
			{
				request_id: "request-id",
				status: "IN_PROGRESS",
				response_url: "https://queue.fal.run/fal-ai/some-model/requests/request-id",
			},
			"https://router.huggingface.co/fal-ai/fal-ai/some-model?_subdomain=queue",
			{ Authorization: "Bearer token" },
			undefined,
		);

		await vi.advanceTimersByTimeAsync(500);
		const result = await responsePromise;

		expect(result).toEqual([
			{
				blob: base64FromBytes(audioBytes),
				"content-type": "audio/x-wav",
				label: "vocals",
			},
		]);
	});

	itWithFakeTimers("throws on malformed response", async () => {
		vi.useFakeTimers();
		const fetchMock = vi.fn<Parameters<typeof fetch>, ReturnType<typeof fetch>>((url) => {
			const urlStr = String(url);
			if (urlStr.includes("/status")) {
				return Promise.resolve(new Response(JSON.stringify({ status: "COMPLETED" })));
			}
			return Promise.resolve(new Response(JSON.stringify({ invalid: true })));
		});
		vi.stubGlobal("fetch", fetchMock);

		const task = new FalAIAudioToAudioTask();
		const responsePromise = task.getResponse(
			{
				request_id: "request-id",
				status: "IN_PROGRESS",
				response_url: "https://queue.fal.run/fal-ai/some-model/requests/request-id",
			},
			"https://router.huggingface.co/fal-ai/fal-ai/some-model?_subdomain=queue",
			{ Authorization: "Bearer token" },
		);
		const assertion = expect(responsePromise).rejects.toBeInstanceOf(InferenceClientProviderOutputError);

		await vi.advanceTimersByTimeAsync(500);
		await assertion;
	});

	it("remaps browser audio MIME types in preparePayloadAsync", async () => {
		const task = new FalAIAudioToAudioTask();
		const payload = await task.preparePayloadAsync({
			provider: "fal-ai",
			model: "fal-ai/some-model",
			inputs: new Blob([new Uint8Array([1, 2, 3])], { type: "audio/webm;codecs=opus" }),
		});

		expect((payload as Record<string, unknown>).audio_url).toMatch(/^data:video\/webm;base64,/);
	});
});
