import { writeFileSync } from "fs";
import { describe, expect, it } from "vitest";
import { WebBlob } from "./WebBlob";

describe("WebBlob", () => {
	const resourceUrl = new URL("https://huggingface.co/spaces/aschen/push-model-from-web/raw/main/mobilenet/model.json");

	it.only("should create a WebBlob with a slice on the entire resource", async () => {
		const response = await fetch(resourceUrl, { method: "HEAD" });
		const size = Number(response.headers.get("content-length"));
		const contentType = response.headers.get("content-type") || "";

		const webBlob = await WebBlob.create(resourceUrl);

		expect(webBlob).toMatchObject({
			url: resourceUrl,
			start: 0,
			end: size,
			contentType,
		});
		// expect(webBlob.size).toBe(size);
		// expect(webBlob.type).toBe(contentType);

		// const text = await webBlob.text();
		// const expectedText = await (await fetch(resourceUrl)).text();
		// expect(text).toBe(expectedText);

		// const result = await (await webBlob.stream()).getReader().read();
		// expect(new TextDecoder().decode(result.value)).toBe(expectedText);
	}, 20000);

	it.skip("should create a slice on the file", async () => {
		const file = await open("package.json", "r");
		const webBlob = await WebBlob.create("package.json");

		const slice = webBlob.slice(10, 20);

		expect(slice).toMatchObject({
			path: "package.json",
			start: 10,
			end: 20,
		});
		expect(slice.size).toBe(10);
		const sliceText = await slice.text();
		const expectedText = (await file.read(Buffer.alloc(10), 0, 10, 10)).buffer.toString("utf8");
		expect(sliceText).toBe(expectedText);
		const result = await slice.stream().getReader().read();
		expect(new TextDecoder().decode(result.value)).toBe(expectedText);
	});
});
