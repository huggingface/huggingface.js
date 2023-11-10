import { describe, expect, it } from "vitest";
import { language } from "./language";

describe("language", () => {
	it("should return an object for a 2-letter language code", () => {
		expect(language("en")).toMatchObject({
			code: "en",
			name: "English",
			nativeName: "English",
		});
	});

	it("should return an object for a 3-letter language code", () => {
		expect(language("eng")).toMatchObject({
			code: "eng",
			name: "English",
		});

		expect(language("fra")).toMatchObject({
			code: "fra",
			name: "French",
		});
	});

	it("should return null for an invalid language code", () => {
		expect(language("invalid")).toBeNull();
	});
});
