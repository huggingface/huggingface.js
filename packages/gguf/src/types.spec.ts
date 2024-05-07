import { describe, it } from "vitest";
import type { gguf } from "./gguf";
import type { GGUFMetadata, GGUFParseOutput } from "./types";

describe("gguf-types", () => {
	it("gguf() type can be casted between STRICT and NON_STRICT (at compile time)", async () => {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const result: Awaited<ReturnType<typeof gguf>> = { metadata: {} } as any;
		const strictType = result as GGUFParseOutput<{ strict: true }>;
		// @ts-expect-error because the key "abc" does not exist
		strictType.metadata.abc = 123;
		const nonStrictType = result as GGUFParseOutput<{ strict: false }>;
		nonStrictType.metadata.abc = 123; // PASS, because it can be anything
		// @ts-expect-error because ArrayBuffer is not a MetadataValue
		nonStrictType.metadata.fff = ArrayBuffer;
	});

	it("GGUFType.NON_STRICT should be correct (at compile time)", async () => {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const model: GGUFMetadata<{ strict: false }> = {} as any;
		model.kv_count = 123n;
		model.abc = 456; // PASS, because it can be anything
	});

	it("GGUFType.STRICT should be correct (at compile time)", async () => {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const model: GGUFMetadata<{ strict: true }> = {} as any;

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
