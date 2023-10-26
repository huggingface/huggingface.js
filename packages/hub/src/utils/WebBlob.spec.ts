import { describe, expect, it, beforeAll } from "vitest";
import { base64FromBytes } from "../../../shared";
import { WebBlob } from "./WebBlob";

describe("WebBlob", () => {
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
			"https://huggingface.co/runwayml/stable-diffusion-v1-5/resolve/39593d5650112b4cc580433f6b0435385882d819/v1-5-pruned.safetensors";
		const url = new URL(stableDiffusionUrl);
		const webBlob = await WebBlob.create(url);

		expect(webBlob.size).toBe(7_703_324_286);
		expect(webBlob).toBeInstanceOf(WebBlob);
		expect(webBlob).toMatchObject({ url });
		expect(base64FromBytes(new Uint8Array(await webBlob.slice(6, 12).arrayBuffer()))).toBe("AAB7Il9f");
		expect(base64FromBytes(new Uint8Array(await webBlob.slice(0, 12).arrayBuffer()))).toBe("ytIDAAAAAAB7Il9f");
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
});
