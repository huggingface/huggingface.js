import { afterEach, describe, expect, it, vi } from "vitest";
import { WavespeedAITextToImageTask } from "../src/providers/wavespeed.js";
import { InferenceClientProviderOutputError } from "../src/errors.js";

vi.mock("../src/utils/delay.js", () => ({ delay: () => Promise.resolve() }));

const SUBMIT_URL = "https://api.wavespeed.ai/api/v3/wavespeed-ai/flux-schnell";
const RESULT_URL = "https://api.wavespeed.ai/api/v3/predictions/task-123/result";
const HEADERS = { Authorization: "Bearer token" };
const SUBMIT_RESPONSE = { code: 200, message: "success", data: { id: "task-123", urls: { get: RESULT_URL } } };

function resultResponse(data: Record<string, unknown>): Response {
	return new Response(JSON.stringify({ code: 200, message: "success", data: { id: "task-123", ...data } }), {
		headers: { "Content-Type": "application/json" },
	});
}

describe("WaveSpeed AI result polling", () => {
	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it.each([
		["failed", "Out of memory", "Out of memory"],
		["failed", "", "WaveSpeed AI task failed"],
		["cancelled", "", "WaveSpeed AI task cancelled"],
		["timeout", "Generation timed out", "Generation timed out"],
		["timeout", "", "WaveSpeed AI task timeout"],
		["deleted", "", "WaveSpeed AI task deleted"],
	])("stops polling on terminal status %s (error: %j)", async (status, error, expectedMessage) => {
		const fetchMock = vi.fn<Parameters<typeof fetch>, ReturnType<typeof fetch>>();
		fetchMock
			.mockResolvedValueOnce(resultResponse({ status: "processing", outputs: [], error: "" }))
			.mockResolvedValueOnce(resultResponse({ status, outputs: [], error }));
		vi.stubGlobal("fetch", fetchMock);

		const promise = new WavespeedAITextToImageTask().getResponse(SUBMIT_RESPONSE as never, SUBMIT_URL, HEADERS, "url");

		await expect(promise).rejects.toThrow(InferenceClientProviderOutputError);
		await expect(promise).rejects.toThrow(expectedMessage);
		expect(fetchMock).toHaveBeenCalledTimes(2);
	});

	it("returns the output URL once the task completes", async () => {
		const fetchMock = vi.fn<Parameters<typeof fetch>, ReturnType<typeof fetch>>();
		fetchMock
			.mockResolvedValueOnce(resultResponse({ status: "created", outputs: [], error: "" }))
			.mockResolvedValueOnce(resultResponse({ status: "processing", outputs: [], error: "" }))
			.mockResolvedValueOnce(
				resultResponse({ status: "completed", outputs: ["https://example.com/output.png"], error: "" }),
			);
		vi.stubGlobal("fetch", fetchMock);

		const result = await new WavespeedAITextToImageTask().getResponse(
			SUBMIT_RESPONSE as never,
			SUBMIT_URL,
			HEADERS,
			"url",
		);

		expect(result).toBe("https://example.com/output.png");
		expect(fetchMock).toHaveBeenCalledTimes(3);
		expect(fetchMock).toHaveBeenCalledWith(RESULT_URL, expect.objectContaining({ headers: HEADERS }));
	});

	it("gives up after a bounded number of polls", async () => {
		const fetchMock = vi.fn<Parameters<typeof fetch>, ReturnType<typeof fetch>>(() =>
			Promise.resolve(resultResponse({ status: "processing", outputs: [], error: "" })),
		);
		vi.stubGlobal("fetch", fetchMock);

		const promise = new WavespeedAITextToImageTask().getResponse(SUBMIT_RESPONSE as never, SUBMIT_URL, HEADERS, "url");

		await expect(promise).rejects.toThrow(/Timed out while waiting for the result from WaveSpeed AI API/);
		expect(fetchMock).toHaveBeenCalledTimes(7200);
	});
});
