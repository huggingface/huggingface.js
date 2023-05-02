import { assert, it, describe } from "vitest";
import { computeNumOfParamsByDtype, parseSafetensorsFromModelRepo } from "./parse-safetensors";

describe("parseSafetensorsFromModelRepo", () => {
	it("fetch info for single-file", async () => {
		const parse = await parseSafetensorsFromModelRepo({
			repo: "bert-base-uncased",
			hubUrl: "https://huggingface.co",
		});

		assert(!parse.sharded);
		assert.deepStrictEqual(parse.header.__metadata__, { format: "pt" });

		/// Example of one tensor (the header contains many tensors)

		assert.deepStrictEqual(parse.header["bert.embeddings.LayerNorm.beta"], {
			dtype: "F32",
			shape: [768],
			data_offsets: [0, 3072],
		});

		const counter = computeNumOfParamsByDtype(parse);
		assert.deepStrictEqual(counter.dict(), { F32: 110106428 });
		assert.deepStrictEqual(counter.total(), 110_106_428);
		/// total params = 110m
	});

	it("fetch info for sharded", async () => {
		const parse = await parseSafetensorsFromModelRepo({
			repo: "bigscience/bloom",
			hubUrl: "https://huggingface.co",
		});

		assert(parse.sharded);

		assert.strictEqual(Object.keys(parse.headers).length, 72);
		/// This model has 72 shards!

		/// Example of one tensor inside one file

		assert.deepStrictEqual(parse.headers["model_00012-of-00072.safetensors"]["h.10.input_layernorm.weight"], {
			dtype: "BF16",
			shape: [14336],
			data_offsets: [3288649728, 3288678400],
		});

		const counter = computeNumOfParamsByDtype(parse);
		assert.deepStrictEqual(counter.dict(), { BF16: 176247271424 });
		assert.deepStrictEqual(counter.total(), 176_247_271_424);
		/// total params = 176B
	});
});
