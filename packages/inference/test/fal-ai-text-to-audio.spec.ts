import { afterEach, describe, expect, it, vi } from "vitest";
import { InferenceClientProviderOutputError } from "../src/errors.js";
import { FalAITextToAudioTask } from "../src/providers/fal-ai.js";
import type { BodyParams } from "../src/types.js";

const itWithFakeTimers = typeof window !== "undefined" && typeof window.document !== "undefined" ? it.skip : it;

const QUEUE_OUTPUT = {
	request_id: "request-id",
	status: "IN_PROGRESS",
	response_url: "https://queue.fal.run/fal-ai/some-model/requests/request-id",
};
const QUEUE_URL = "https://router.huggingface.co/fal-ai/fal-ai/some-model?_subdomain=queue";
const HEADERS = { Authorization: "Bearer token" };

describe("FalAITextToAudioTask", () => {
	afterEach(() => {
		vi.unstubAllGlobals();
		vi.useRealTimers();
	});

	itWithFakeTimers("returns audio blob after queue completes (audio_file field)", async () => {
		vi.useFakeTimers();
		const audioBytes = new Uint8Array([1, 2, 3, 4]);
		const audioBlob = new Blob([audioBytes], { type: "audio/mpeg" });

		const fetchMock = vi.fn<Parameters<typeof fetch>, ReturnType<typeof fetch>>((url) => {
			const urlStr = String(url);
			if (urlStr.includes("/status")) {
				return Promise.resolve(new Response(JSON.stringify({ status: "COMPLETED" })));
			}
			if (urlStr.includes("cdn.example.com")) {
				return Promise.resolve(new Response(audioBlob, { headers: { "Content-Type": "audio/mpeg" } }));
			}
			return Promise.resolve(
				new Response(
					JSON.stringify({
						audio_file: { url: "https://cdn.example.com/music.mp3", content_type: "audio/mpeg" },
					}),
				),
			);
		});
		vi.stubGlobal("fetch", fetchMock);

		const task = new FalAITextToAudioTask();
		const responsePromise = task.getResponse(QUEUE_OUTPUT, QUEUE_URL, HEADERS, undefined);

		await vi.advanceTimersByTimeAsync(500);
		const result = await responsePromise;

		expect(result).toBeInstanceOf(Blob);
		expect(new Uint8Array(await result.arrayBuffer())).toEqual(audioBytes);
	});

	itWithFakeTimers("falls back to the `audio` field", async () => {
		vi.useFakeTimers();
		const audioBytes = new Uint8Array([5, 6, 7]);
		const audioBlob = new Blob([audioBytes], { type: "audio/mpeg" });

		const fetchMock = vi.fn<Parameters<typeof fetch>, ReturnType<typeof fetch>>((url) => {
			const urlStr = String(url);
			if (urlStr.includes("/status")) {
				return Promise.resolve(new Response(JSON.stringify({ status: "COMPLETED" })));
			}
			if (urlStr.includes("cdn.example.com")) {
				return Promise.resolve(new Response(audioBlob));
			}
			return Promise.resolve(new Response(JSON.stringify({ audio: { url: "https://cdn.example.com/song.mp3" } })));
		});
		vi.stubGlobal("fetch", fetchMock);

		const task = new FalAITextToAudioTask();
		const responsePromise = task.getResponse(QUEUE_OUTPUT, QUEUE_URL, HEADERS, undefined);

		await vi.advanceTimersByTimeAsync(500);
		const result = await responsePromise;

		expect(new Uint8Array(await result.arrayBuffer())).toEqual(audioBytes);
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

		const task = new FalAITextToAudioTask();
		const responsePromise = task.getResponse(QUEUE_OUTPUT, QUEUE_URL, HEADERS);
		const assertion = expect(responsePromise).rejects.toBeInstanceOf(InferenceClientProviderOutputError);

		await vi.advanceTimersByTimeAsync(500);
		await assertion;
	});

	it("maps inputs to prompt and flattens parameters in preparePayload", () => {
		const task = new FalAITextToAudioTask();
		const payload = task.preparePayload({
			args: { inputs: "lo-fi hip hop beats", parameters: { seconds_total: 10, steps: 50 } },
		} as unknown as BodyParams);

		expect(payload).toMatchObject({ prompt: "lo-fi hip hop beats", seconds_total: 10, steps: 50 });
		expect(payload).not.toHaveProperty("inputs");
		expect(payload).not.toHaveProperty("parameters");
	});
});
