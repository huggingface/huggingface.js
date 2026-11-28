import { describe, expect, it, beforeAll } from "vitest";
import { WebBlob } from "./WebBlob";

describe("WebBlob", () => {
	const resourceUrl = new URL("https://huggingface.co/spaces/aschen/push-model-from-web/raw/main/mobilenet/model.json");
	let fullText: string;
	let size: number;
	let contentType: string;

	beforeAll(async () => {
		const response = await fetch(resourceUrl);
		contentType = response.headers.get("content-type") || "";
		const blob = await response.blob();
		size = blob.size;
		fullText = await blob.text();
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

	it("should throw a TypeError on negative start/end", () => {
		const webBlob = new WebBlob(resourceUrl, 0, 100, "text/plain", true, fetch);

		expect(() => webBlob.slice(-5)).toThrow(TypeError);
		expect(() => webBlob.slice(0, -1)).toThrow(TypeError);
	});
});

describe("WebBlob range probe", () => {
	const url = new URL("https://example.com/model.json");
	it("uses the range total when HEAD would omit the size", async () => {
		const requests: RequestInit[] = [];
		let cancelled = false;
		const customFetch: typeof fetch = async (_url, init) => {
			requests.push(init ?? {});
			if (init?.method === "HEAD") {
				return new Response(null);
			}
			if (new Headers(init?.headers).get("Range") === "bytes=0-0") {
				return new Response(
					new ReadableStream({
						cancel() {
							cancelled = true;
						},
					}),
					{
						status: 206,
						headers: { "Content-Range": "bytes 0-0/10", "Content-Type": "text/plain" },
					},
				);
			}
			return new Response("0123456789");
		};
		const blob = await WebBlob.create(url, { fetch: customFetch, cacheBelow: 0 });
		expect(blob).toBeInstanceOf(WebBlob);
		expect(blob.size).toBe(10);
		expect(blob.type).toBe("text/plain");
		expect(cancelled).toBe(true);
		expect(requests).toHaveLength(1);
		expect(new Headers(requests[0].headers).get("Range")).toBe("bytes=0-0");
		expect(await blob.text()).toBe("0123456789");
	});

	it("fetches an empty resource after an unsatisfiable range probe", async () => {
		let requests = 0;
		const blob = await WebBlob.create(url, {
			fetch: async () => {
				requests++;
				return requests === 1
					? new Response("Range not satisfiable", { status: 416, headers: { "Content-Range": "bytes */0" } })
					: new Response("", { headers: { "Content-Type": "application/json" } });
			},
		});
		expect(blob.size).toBe(0);
		expect(blob.type).toBe("application/json");
		expect(await blob.text()).toBe("");
		expect(requests).toBe(2);
	});

	it.each([403, 500])("rejects an HTTP %s probe instead of exposing its body", async (status) => {
		await expect(
			WebBlob.create(url, {
				fetch: async () => new Response("error payload", { status }),
			}),
		).rejects.toThrow(`HTTP ${status}`);
	});

	it("rejects an error from the full-file fallback", async () => {
		let requests = 0;
		await expect(
			WebBlob.create(url, {
				fetch: async () =>
					++requests === 1
						? new Response("0", { status: 206, headers: { "Content-Range": "bytes 0-0/10" } })
						: new Response("error payload", { status: 404 }),
			}),
		).rejects.toThrow("HTTP 404");
	});

	it("reuses the full response when ranges are ignored", async () => {
		let requests = 0;
		const blob = await WebBlob.create(url, {
			fetch: async () => {
				requests++;
				return new Response("full content");
			},
		});
		expect(await blob.text()).toBe("full content");
		expect(requests).toBe(1);
	});

	it.each(["bytes 0-0/10", "bytes 0-0/*", null])("buffers a small or unknown range total %s", async (range) => {
		let requests = 0;
		const blob = await WebBlob.create(url, {
			fetch: async () => {
				requests++;
				if (requests === 1) {
					return new Response("0", { status: 206, headers: range ? { "Content-Range": range } : {} });
				}
				return new Response("0123456789");
			},
		});
		expect(blob).not.toBeInstanceOf(WebBlob);
		expect(blob.size).toBe(10);
		expect(await blob.text()).toBe("0123456789");
	});
});
