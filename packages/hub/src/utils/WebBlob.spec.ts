import { describe, expect, it, beforeAll } from "vitest";
import { WebBlob } from "./WebBlob";

describe("WebBlob", () => {
	const resourceUrl = new URL("https://huggingface.co/spaces/aschen/push-model-from-web/raw/main/mobilenet/model.json");
	let fullText: string;
	let size: number;
	let contentType: string;

	const fetchWithContentLength: typeof fetch = async (input, init) => {
		if ((init as RequestInit | undefined)?.method === "HEAD") {
			const response = await fetch(input, init);
			const headers = new Headers(response.headers);
			headers.set("content-length", String(size));
			headers.set("accept-ranges", "bytes");
			return new Response(null, { status: response.status, headers });
		}
		return fetch(input, init);
	};

	beforeAll(async () => {
		// Use a GET request so we can derive size from the actual response body —
		// content-length from HEAD is not CORS-exposed in browsers.
		const response = await fetch(resourceUrl);
		fullText = await response.text();
		contentType = response.headers.get("content-type") || "";
		size = new TextEncoder().encode(fullText).byteLength;
	});

	it("should create a WebBlob with a slice on the entire resource", async () => {
		const webBlob = await WebBlob.create(resourceUrl, {
			cacheBelow: 0,
			accessToken: undefined,
			fetch: fetchWithContentLength,
		});

		expect(webBlob).toMatchObject({
			url: resourceUrl,
			start: 0,
			end: size,
			contentType,
		});
		expect(webBlob).toBeInstanceOf(WebBlob);
		expect(webBlob.size).toBe(size);
		expect(webBlob.type).toBe(contentType);

		const text = await webBlob.text();
		expect(text).toBe(fullText);

		const streamText = await new Response(webBlob.stream()).text();
		expect(streamText).toBe(fullText);
	});

	it("should create a WebBlob with a slice on the entire resource, cached", async () => {
		const webBlob = await WebBlob.create(resourceUrl, { cacheBelow: 1_000_000, accessToken: undefined });

		expect(webBlob).not.toBeInstanceOf(WebBlob);
		expect(webBlob.size).toBe(size);
		expect(webBlob.type.replace(/;\s*charset=utf-8/, "")).toBe(contentType.replace(/;\s*charset=utf-8/, ""));

		const text = await webBlob.text();
		expect(text).toBe(fullText);

		const streamText = await new Response(webBlob.stream()).text();
		expect(streamText).toBe(fullText);
	});

	it("should lazy load a LFS file hosted on Hugging Face", async () => {
		const zephyrUrl =
			"https://huggingface.co/HuggingFaceH4/zephyr-7b-alpha/resolve/main/model-00001-of-00008.safetensors";
		const url = new URL(zephyrUrl);
		const webBlob = await WebBlob.create(url);

		expect(webBlob.size).toBe(1_889_587_040);
		expect(webBlob).toBeInstanceOf(WebBlob);
		expect(webBlob).toMatchObject({ url });
		expect(await webBlob.slice(10, 22).text()).toBe("__metadata__");
	});

	it("should lazy load a Xet file hosted on Hugging Face", async () => {
		const stableDiffusionUrl =
			"https://huggingface.co/stabilityai/stable-diffusion-xl-base-1.0/resolve/main/unet/diffusion_pytorch_model.fp16.safetensors";
		const url = new URL(stableDiffusionUrl);
		const webBlob = await WebBlob.create(url);

		expect(webBlob.size).toBe(5_135_149_760);
		expect(webBlob).toBeInstanceOf(WebBlob);
		expect(webBlob).toMatchObject({ url });
		expect(await webBlob.slice(10, 22).text()).toBe("__metadata__");
	});

	it("should create a slice on the file", async () => {
		const expectedText = fullText.slice(10, 20);

		const slice = (
			await WebBlob.create(resourceUrl, { cacheBelow: 0, accessToken: undefined, fetch: fetchWithContentLength })
		).slice(10, 20);

		expect(slice).toMatchObject({
			url: resourceUrl,
			start: 10,
			end: 20,
			contentType,
		});
		expect(slice.size).toBe(10);
		expect(slice.type).toBe(contentType);

		const sliceText = await slice.text();
		expect(sliceText).toBe(expectedText);

		const streamText = await new Response(slice.stream()).text();
		expect(streamText).toBe(expectedText);
	});
});
