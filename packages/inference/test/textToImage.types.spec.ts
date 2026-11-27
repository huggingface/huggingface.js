import { describe, expectTypeOf, it } from "vitest";

import type { InferenceClient } from "../src/index.js";
import { textToImage } from "../src/index.js";

const args = { model: "black-forest-labs/FLUX.1-schnell", inputs: "a cat" };

// Never called: only checked by `tsc`, so the overloads resolve to the runtime return type.
async function returnTypes(client: InferenceClient) {
	expectTypeOf(await textToImage(args)).toEqualTypeOf<Blob>();
	expectTypeOf(await textToImage(args, {})).toEqualTypeOf<Blob>();
	expectTypeOf(await textToImage(args, { outputType: "blob" })).toEqualTypeOf<Blob>();
	expectTypeOf(await textToImage(args, { outputType: "url" })).toEqualTypeOf<string>();
	expectTypeOf(await textToImage(args, { outputType: "dataUrl" })).toEqualTypeOf<string>();
	expectTypeOf(await textToImage(args, { outputType: "json" })).toEqualTypeOf<Record<string, unknown>>();
	expectTypeOf(await client.textToImage(args)).toEqualTypeOf<Blob>();
	expectTypeOf(await client.textToImage(args, { outputType: "url" })).toEqualTypeOf<string>();
}

describe("textToImage", () => {
	it("types the result by outputType, with a Blob by default", () => {
		expectTypeOf(returnTypes).toBeFunction();
	});
});
