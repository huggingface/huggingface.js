import { afterEach, describe, expect, it, vi } from "vitest";
import { DeepInfraTextToImageTask } from "../src/providers/deepinfra.js";
import { InferenceClientProviderOutputError } from "../src/errors.js";

const IMAGE_URL = "https://example.com/image.png";
const IMAGE_BYTES = Uint8Array.of(1, 2, 3, 4);
const URL_RESPONSE = { data: [{ url: IMAGE_URL }] };

describe("DeepInfra text-to-image output types", () => {
	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it.each([undefined, "blob"] as const)("downloads a URL response as a Blob for outputType %s", async (outputType) => {
		const fetchMock = vi.fn<Parameters<typeof fetch>, ReturnType<typeof fetch>>(() =>
			Promise.resolve(new Response(IMAGE_BYTES, { headers: { "Content-Type": "image/png" } })),
		);
		vi.stubGlobal("fetch", fetchMock);
		const controller = new AbortController();
		const result = await new DeepInfraTextToImageTask().getResponse(
			URL_RESPONSE,
			undefined,
			undefined,
			outputType,
			controller.signal,
		);
		expect(result).toBeInstanceOf(Blob);
		expect((result as Blob).type).toBe("image/png");
		expect(new Uint8Array(await (result as Blob).arrayBuffer())).toEqual(IMAGE_BYTES);
		expect(fetchMock).toHaveBeenCalledWith(IMAGE_URL, { signal: controller.signal });
	});

	it("converts a URL response to a data URL using the downloaded content type", async () => {
		vi.stubGlobal(
			"fetch",
			vi.fn(() => Promise.resolve(new Response(IMAGE_BYTES, { headers: { "Content-Type": "image/png" } }))),
		);
		const result = await new DeepInfraTextToImageTask().getResponse(URL_RESPONSE, undefined, undefined, "dataUrl");
		expect(result).toBe("data:image/png;base64,AQIDBA==");
	});

	it("returns the provider URL without downloading when requested", async () => {
		const fetchMock = vi.fn();
		vi.stubGlobal("fetch", fetchMock);
		await expect(new DeepInfraTextToImageTask().getResponse(URL_RESPONSE, undefined, undefined, "url")).resolves.toBe(
			IMAGE_URL,
		);
		expect(fetchMock).not.toHaveBeenCalled();
	});

	it("preserves the raw JSON response without downloading", async () => {
		const fetchMock = vi.fn();
		vi.stubGlobal("fetch", fetchMock);
		await expect(
			new DeepInfraTextToImageTask().getResponse(URL_RESPONSE, undefined, undefined, "json"),
		).resolves.toEqual(URL_RESPONSE);
		expect(fetchMock).not.toHaveBeenCalled();
	});

	it("rejects failed image downloads instead of returning the error body as an image", async () => {
		vi.stubGlobal(
			"fetch",
			vi.fn(() => Promise.resolve(new Response("not found", { status: 404 }))),
		);
		await expect(new DeepInfraTextToImageTask().getResponse(URL_RESPONSE)).rejects.toThrow(
			InferenceClientProviderOutputError,
		);
	});

	it("propagates a cancelled image download", async () => {
		const error = new DOMException("The operation was aborted", "AbortError");
		const fetchMock = vi.fn(() => Promise.reject(error));
		vi.stubGlobal("fetch", fetchMock);
		const controller = new AbortController();
		controller.abort();
		await expect(
			new DeepInfraTextToImageTask().getResponse(URL_RESPONSE, undefined, undefined, "blob", controller.signal),
		).rejects.toBe(error);
		expect(fetchMock).toHaveBeenCalledWith(IMAGE_URL, { signal: controller.signal });
	});

	it("preserves base64 response conversion to a Blob", async () => {
		const result = await new DeepInfraTextToImageTask().getResponse({ data: [{ b64_json: "AQIDBA==" }] });
		expect(result).toBeInstanceOf(Blob);
		expect(new Uint8Array(await (result as Blob).arrayBuffer())).toEqual(IMAGE_BYTES);
	});

	it("preserves base64 response conversion to a data URL", async () => {
		await expect(
			new DeepInfraTextToImageTask().getResponse({ data: [{ b64_json: "AQIDBA==" }] }, undefined, undefined, "dataUrl"),
		).resolves.toBe("data:image/jpeg;base64,AQIDBA==");
	});
});
