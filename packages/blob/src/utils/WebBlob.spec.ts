import { describe, expect, it, beforeAll, vi } from "vitest";
import { WebBlob } from "./WebBlob";

describe("WebBlob", () => {
	const url = new URL("https://example.test/object");
	const resourceUrl = new URL("https://huggingface.co/spaces/aschen/push-model-from-web/raw/main/mobilenet/model.json");
	let fullText: string;
	let size: number;
	let contentType: string;

	beforeAll(async () => {
		const response = await fetch(resourceUrl, { method: "HEAD" });
		size = Number(response.headers.get("content-length"));
		contentType = response.headers.get("content-type") || "";
		fullText = await (await fetch(resourceUrl)).text();
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

	it("reports the real size when HEAD omits content-length", async () => {
		const ranges: Array<string | undefined> = [];
		const customFetch = vi.fn(async (_url: URL, init?: RequestInit) => {
			if (init?.method === "HEAD") {
				return new Response(null, { headers: { "accept-ranges": "bytes", "content-type": "text/plain" } });
			}
			ranges.push((init?.headers as Record<string, string> | undefined)?.Range);
			return new Response("x", {
				status: 206,
				headers: { "content-range": "bytes 0-0/10", "content-type": "text/plain" },
			});
		});

		// cacheBelow: 0 keeps the lazy path in play for a 10-byte resource, which is what makes the
		// missing content-length observable: without the probe the blob reports size 0 and slices to
		// a malformed `Range: bytes=0--1`.
		const blob = await WebBlob.create(url, { cacheBelow: 0, fetch: customFetch as typeof fetch });

		expect(blob).toBeInstanceOf(WebBlob);
		expect(blob.size).toBe(10);
		expect(blob.slice(0, 4).size).toBe(4);
		expect(ranges).toEqual(["bytes=0-0"]);
		await blob.slice(0, 4).text();
		expect(ranges).toEqual(["bytes=0-0", "bytes=0-3"]);
	});

	it("uses the lazy path for a large resource whose HEAD omits accept-ranges", async () => {
		const customFetch = vi.fn(async (_url: URL, init?: RequestInit) => {
			if (init?.method === "HEAD") {
				return new Response(null, { headers: { "content-length": "50000000", "content-type": "text/plain" } });
			}
			return new Response("x", {
				status: 206,
				headers: { "content-range": "bytes 0-0/50000000", "content-type": "text/plain" },
			});
		});

		// Default cacheBelow: no options beyond the injected fetch.
		const blob = await WebBlob.create(url, { fetch: customFetch as typeof fetch });

		expect(blob).toBeInstanceOf(WebBlob);
		expect(blob.size).toBe(50_000_000);
		expect(customFetch).toHaveBeenCalledTimes(2);
	});

	it("does not probe when HEAD already gives a size below cacheBelow", async () => {
		const customFetch = vi.fn(async (_url: URL, init?: RequestInit) => {
			if (init?.method === "HEAD") {
				return new Response(null, { headers: { "content-length": "500", "content-type": "text/plain" } });
			}
			return new Response("small body");
		});

		const blob = await WebBlob.create(url, { fetch: customFetch as typeof fetch });

		expect(await blob.text()).toBe("small body");
		expect(customFetch).toHaveBeenCalledTimes(2);
		expect(customFetch).toHaveBeenLastCalledWith(url);
	});

	it("issues an extra GET when the probe reveals a size below cacheBelow", async () => {
		const customFetch = vi.fn(async (_url: URL, init?: RequestInit) => {
			if (init?.method === "HEAD") {
				return new Response(null, { headers: { "accept-ranges": "bytes" } });
			}
			if (init?.headers) {
				return new Response("x", { status: 206, headers: { "content-range": "bytes 0-0/500" } });
			}
			return new Response("small body");
		});

		const blob = await WebBlob.create(url, { fetch: customFetch as typeof fetch });

		expect(blob).not.toBeInstanceOf(WebBlob);
		expect(await blob.text()).toBe("small body");
		// HEAD + probe + GET: one round trip more than before, the price of learning the real size.
		expect(customFetch).toHaveBeenCalledTimes(3);
	});

	it("reuses a full-body range probe when a server ignores Range", async () => {
		const customFetch = vi.fn(async (_url: URL, init?: RequestInit) => {
			if (init?.method === "HEAD") {
				return new Response(null);
			}
			return new Response("full response", { status: 200, headers: { "content-type": "text/plain" } });
		});

		const blob = await WebBlob.create(url, { fetch: customFetch as typeof fetch });

		expect(blob).not.toBeInstanceOf(WebBlob);
		expect(await blob.text()).toBe("full response");
		// HEAD + the probe itself: the probe body is reused instead of issuing a second plain GET.
		expect(customFetch).toHaveBeenCalledTimes(2);
		expect(customFetch).toHaveBeenLastCalledWith(url, { headers: { Range: "bytes=0-0" } });
	});

	it("handles an empty ranged resource without a fallback GET", async () => {
		const customFetch = vi.fn(async (_url: URL, init?: RequestInit) => {
			if (init?.method === "HEAD") {
				return new Response(null);
			}
			return new Response(null, { status: 416, headers: { "content-range": "bytes */0" } });
		});

		const blob = await WebBlob.create(url, { fetch: customFetch as typeof fetch });

		expect(blob.size).toBe(0);
		expect(customFetch).toHaveBeenCalledTimes(2);
		expect(customFetch).toHaveBeenLastCalledWith(url, { headers: { Range: "bytes=0-0" } });
	});

	it("falls back to GET for malformed range totals", async () => {
		const customFetch = vi.fn(async (_url: URL, init?: RequestInit) => {
			if (init?.method === "HEAD") {
				return new Response(null);
			}
			if (init?.headers) {
				return new Response("x", { status: 206, headers: { "content-range": "bytes 0-0/not-a-number" } });
			}
			return new Response("fallback");
		});

		const blob = await WebBlob.create(url, { fetch: customFetch as typeof fetch });

		expect(await blob.text()).toBe("fallback");
		// HEAD + probe + GET: the extra round trip when the probe tells us nothing usable.
		expect(customFetch).toHaveBeenCalledTimes(3);
	});

	it("falls back to GET when a positive range header has the wrong status", async () => {
		const customFetch = vi.fn(async (_url: URL, init?: RequestInit) => {
			if (init?.method === "HEAD") {
				return new Response(null);
			}
			if (init?.headers) {
				return new Response("x", { status: 500, headers: { "content-range": "bytes 0-0/10" } });
			}
			return new Response("fallback");
		});
		expect(await (await WebBlob.create(url, { fetch: customFetch as typeof fetch })).text()).toBe("fallback");
	});

	it("falls back to GET when an empty range header has the wrong status", async () => {
		const customFetch = vi.fn(async (_url: URL, init?: RequestInit) => {
			if (init?.method === "HEAD") {
				return new Response(null);
			}
			if (init?.headers) {
				return new Response(null, { status: 500, headers: { "content-range": "bytes */0" } });
			}
			return new Response("fallback");
		});
		expect(await (await WebBlob.create(url, { fetch: customFetch as typeof fetch })).text()).toBe("fallback");
	});

	it("keeps a valid positive HEAD range signal on the lazy path", async () => {
		const customFetch = vi.fn(async (_url: URL, init?: RequestInit) => {
			if (init?.method === "HEAD") {
				return new Response(null, { headers: { "content-length": "10", "accept-ranges": "bytes" } });
			}
			return new Response("0123456789", { status: 206 });
		});

		const blob = await WebBlob.create(url, { cacheBelow: 0, fetch: customFetch as typeof fetch });

		expect(blob).toBeInstanceOf(WebBlob);
		expect(customFetch).toHaveBeenCalledTimes(1);
	});
});
