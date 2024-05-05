import { describe, it } from "vitest";
import { GGUFStrictType, GGUFMetadata, GGUFNonStrictType } from "./types";

describe("gguf-types", () => {
  it("GGUFNonStrictType should be correct (at compile time)", async () => {
		const model: GGUFMetadata<GGUFNonStrictType> = null as any;
    model.kv_count = 123n;
    model.abc = 456; // PASS, because it can be anything
	});

	it("GGUFStrictType should be correct (at compile time)", async () => {
		const model: GGUFMetadata<GGUFStrictType> = null as any;

		if (model["general.architecture"] === "whisper") {
			model["encoder.whisper.block_count"] = 0;
			// @ts-expect-error
			model["encoder.whisper.block_count"] = "abc"; // error, because it must be a number
		}

		if (model["tokenizer.ggml.model"] === undefined) {
			// @ts-expect-error
			model["tokenizer.ggml.eos_token_id"] = 1; // error, because it's undefined
		}
		if (model["tokenizer.ggml.model"] === "gpt2") {
			// @ts-expect-error
			model["tokenizer.ggml.eos_token_id"] = undefined; // error, because it must be a number
			model["tokenizer.ggml.eos_token_id"] = 1;
		}

		if (model["general.architecture"] === "mamba") {
			model["mamba.ssm.conv_kernel"] = 0;
			// @ts-expect-error
			model["mamba.ssm.conv_kernel"] = "abc"; // error, because it must be a number
		}
		if (model["general.architecture"] === "llama") {
      // @ts-expect-error
			model["mamba.ssm.conv_kernel"] = 0;
      // @ts-expect-error
			model["mamba.ssm.conv_kernel"] = "abc"; // PASS, because it can be anything
		}
	});
});
