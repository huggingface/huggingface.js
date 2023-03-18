import { describe, expect, it } from "vitest";
import { open, stat } from "node:fs/promises";
import { LazyBlob } from "./LazyBlob";
import { TextDecoder } from "node:util";

describe("LazyBlob", () => {
	it("should create a LazyBlob with a slice on the entire file", async () => {
		const file = await open("package.json", "r");
		const { size } = await stat("package.json");

		const lazyBlob = await LazyBlob.create("package.json");

		expect(lazyBlob).toMatchObject({
			path: "package.json",
			start: 0,
			end: size,
		});
		expect(lazyBlob.size).toBe(size);
		expect(lazyBlob.type).toBe("");
		const text = await lazyBlob.text();
		const expectedText = (await file.read(Buffer.alloc(size), 0, size)).buffer.toString("utf8");
		expect(text).toBe(expectedText);
		const result = await lazyBlob.stream().getReader().read();
		expect(new TextDecoder().decode(result.value)).toBe(expectedText);
	});

	it("should create a slice on the file", async () => {
		const file = await open("package.json", "r");
		const lazyBlob = await LazyBlob.create("package.json");

		const slice = lazyBlob.slice(10, 20);

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
