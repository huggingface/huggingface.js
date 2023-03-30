import { describe, expect, it } from "vitest";
import { WebBlob } from "./WebBlob";

describe("WebBlob", async () => {
	const resourceUrl = new URL("https://huggingface.co/spaces/aschen/push-model-from-web/raw/main/mobilenet/model.json");

	const response = await fetch(resourceUrl, { method: "HEAD" });
	const size = Number(response.headers.get("content-length"));
	const contentType = response.headers.get("content-type") || "";
	const fullText = await (await fetch(resourceUrl)).text();

	it("should create a WebBlob with a slice on the entire resource", async () => {
		const webBlob = await WebBlob.create(resourceUrl);

		expect(webBlob).toMatchObject({
			url: resourceUrl,
			start: 0,
			end: size,
			contentType,
		});
		expect(webBlob.size).toBe(size);
		expect(webBlob.type).toBe(contentType);

		const text = await webBlob.text();
		expect(text).toBe(fullText);

		const streamText = await new Response(webBlob.stream()).text();
		expect(streamText).toBe(fullText);
	});

	it("should create a slice on the file", async () => {
		const expectedText = fullText.slice(10, 20);

		const slice = (await WebBlob.create(resourceUrl)).slice(10, 20);

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
