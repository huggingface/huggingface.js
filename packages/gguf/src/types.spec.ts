import { describe, it } from "vitest";
import type { GGUFStrictType, GGUFMetadata, GGUFNonStrictType } from "./types";

describe("gguf-types", () => {
	it("GGUFNonStrictType should be correct (at compile time)", async () => {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const model: GGUFMetadata<GGUFNonStrictType> = null as any;
		model.kv_count = 123n;
		model.abc = 456; // PASS, because it can be anything
	});

	it("GGUFStrictType should be correct (at compile time)", async () => {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const model: GGUFMetadata<GGUFStrictType> = null as any;

		if (model["general.architecture"] === "whisper") {
			model["encoder.whisper.block_count"] = 0;
			// @ts-expect-error because it must be a number
			model["encoder.whisper.block_count"] = "abc";
		}

		if (model["tokenizer.ggml.model"] === undefined) {
			// @ts-expect-error because it's undefined
			model["tokenizer.ggml.eos_token_id"] = 1;
		}
		if (model["tokenizer.ggml.model"] === "gpt2") {
			// @ts-expect-error because it must be a number
			model["tokenizer.ggml.eos_token_id"] = undefined;
			model["tokenizer.ggml.eos_token_id"] = 1;
		}

		if (model["general.architecture"] === "mamba") {
			model["mamba.ssm.conv_kernel"] = 0;
			// @ts-expect-error because it must be a number
			model["mamba.ssm.conv_kernel"] = "abc";
		}
		if (model["general.architecture"] === "llama") {
			// @ts-expect-error llama does not have ssm.* keys
			model["mamba.ssm.conv_kernel"] = 0;
		}
	});
});
