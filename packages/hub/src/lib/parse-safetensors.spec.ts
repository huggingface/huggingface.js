import { assert, it, describe } from "vitest";
import { computeNumOfParamsByDtype, parseSafetensorsMetadata } from "./parse-safetensors";
import { sum } from "../utils/sum";

describe("parseSafetensorsFromModelRepo", () => {
	it("fetch info for single-file", async () => {
		const parse = await parseSafetensorsMetadata({
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
		assert.deepStrictEqual(counter, { F32: 110106428 });
		assert.deepStrictEqual(sum(Object.values(counter)), 110_106_428);
		/// total params = 110m
	});

	it("fetch info for sharded", async () => {
		const parse = await parseSafetensorsMetadata({
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
		assert.deepStrictEqual(counter, { BF16: 176247271424 });
		assert.deepStrictEqual(sum(Object.values(counter)), 176_247_271_424);
		/// total params = 176B
	});

	it("fetch info for single-file with multiple dtypes", async () => {
		const parse = await parseSafetensorsMetadata({
			repo: "roberta-base",
			hubUrl: "https://huggingface.co",
		});

		assert(!parse.sharded);

		const counter = computeNumOfParamsByDtype(parse);
		assert.deepStrictEqual(counter, { F32: 124697433, I64: 514 });
		assert.deepStrictEqual(sum(Object.values(counter)), 124_697_947);
		/// total params = 124m
	});
});
