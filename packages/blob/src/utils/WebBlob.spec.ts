import { describe, expect, it, beforeAll } from "vitest";
import { WebBlob } from "./WebBlob";

describe("WebBlob", () => {
	const resourceUrl = new URL("https://huggingface.co/spaces/aschen/push-model-from-web/raw/main/mobilenet/model.json");
	let fullText: string;
	let size: number;
	let contentType: string;

	beforeAll(async () => {
		// Compute the reference size from the response body itself; in browsers
		// `Content-Length` is not reliably exposed when the response is gzipped
		// on the fly by CloudFront.
		const response = await fetch(resourceUrl);
		const blob = await response.blob();
		size = blob.size;
		fullText = await blob.text();
		contentType = response.headers.get("content-type") || "";
	});

	it("should create a WebBlob with a slice on the entire resource", async () => {
		const webBlob = await WebBlob.create(resourceUrl, { cacheBelow: 0 });

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
		const webBlob = await WebBlob.create(resourceUrl, { cacheBelow: 1_000_000 });

		expect(webBlob).not.toBeInstanceOf(WebBlob);
		expect(webBlob.size).toBe(size);
		expect(webBlob.type.replace(/;\s*charset=utf-8/, "")).toBe(contentType.replace(/;\s*charset=utf-8/, ""));

		const text = await webBlob.text();
		expect(text).toBe(fullText);

		const streamText = await new Response(webBlob.stream()).text();
		expect(streamText).toBe(fullText);
	});

	it("should lazy load a LFS file hosted on Hugging Face", async () => {
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

		const slice = (await WebBlob.create(resourceUrl, { cacheBelow: 0 })).slice(10, 20);

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

	it("should learn size from Content-Range when HEAD omits Content-Length", async () => {
		const body = "abcdefghijklmnopqrstuvwxyz";
		const url = new URL("https://example.com/model.json");
		const fetchMock = (async (_input: RequestInfo | URL, init?: RequestInit) => {
			const range = new Headers(init?.headers).get("range");

			if (init?.method === "HEAD") {
				return new Response(null, {
					status: 200,
					headers: {
						"accept-ranges": "bytes",
						"content-type": "text/plain",
					},
				});
			}

			if (range?.startsWith("bytes=")) {
				const [start, endRaw] = range.slice("bytes=".length).split("-");
				const startByte = Number(start);
				const endByte = Math.min(Number(endRaw), body.length - 1);
				return new Response(body.slice(startByte, endByte + 1), {
					status: 206,
					headers: {
						"content-type": "text/plain",
						"content-range": `bytes ${startByte}-${endByte}/${body.length}`,
					},
				});
			}

			return new Response(body, {
				status: 200,
				headers: { "content-type": "text/plain" },
			});
		}) as typeof fetch;

		const webBlob = await WebBlob.create(url, { cacheBelow: 0, fetch: fetchMock });

		expect(webBlob).toBeInstanceOf(WebBlob);
		expect(webBlob.size).toBe(body.length);
		expect(await webBlob.slice(10, 22).text()).toBe(body.slice(10, 22));
	});

	it("should throw a TypeError on negative start/end", () => {
		const webBlob = new WebBlob(resourceUrl, 0, 100, "text/plain", true, fetch);

		expect(() => webBlob.slice(-5)).toThrow(TypeError);
		expect(() => webBlob.slice(0, -1)).toThrow(TypeError);
	});
});
