import { describe, expect, it } from "vitest";
import { checkDDUF, type DDUFFileEntry } from "./check-dduf";

describe("check-dduf", () => {
	it("should work", async () => {
		const files: DDUFFileEntry[] = [];
		for await (const file of checkDDUF(
			new URL("https://huggingface.co/spaces/coyotte508/dduf-check/resolve/main/file-64.dduf")
		)) {
			files.push(file);
		}

		expect(files).toEqual([
			{
				fileHeaderOffset: 0,
				name: "vae/",
				size: 0,
				type: "file",
			},
			{
				fileHeaderOffset: 82,
				name: "vae/config.json",
				size: 3,
				type: "file",
			},
			{
				fileHeaderOffset: 178,
				name: "vae/diffusion_pytorch_model.safetensors",
				size: 0,
				type: "file",
			},
			{
				fileHeaderOffset: 295,
				name: "text_encoder_2/",
				size: 0,
				type: "file",
			},
			{
				fileHeaderOffset: 388,
				name: "text_encoder_2/config.json",
				size: 3,
				type: "file",
			},
			{
				fileHeaderOffset: 495,
				name: "text_encoder_2/model-00002-of-00002.safetensors",
				size: 0,
				type: "file",
			},
			{
				fileHeaderOffset: 620,
				name: "text_encoder_2/models.saftensors.index.json",
				size: 3,
				type: "file",
			},
			{
				fileHeaderOffset: 744,
				name: "text_encoder_2/model-00001-of-00002.safetensors",
				size: 0,
				type: "file",
			},
			{
				fileHeaderOffset: 869,
				name: "transformer/",
				size: 0,
				type: "file",
			},
			{
				fileHeaderOffset: 959,
				name: "transformer/config.json",
				size: 3,
				type: "file",
			},
			{
				fileHeaderOffset: 1063,
				name: "transformer/diffusion_pytorch_model.safetensors",
				size: 0,
				type: "file",
			},
			{
				fileHeaderOffset: 1188,
				name: "tokenizer_2/",
				size: 0,
				type: "file",
			},
			{
				fileHeaderOffset: 1278,
				name: "tokenizer_2/vocab.json",
				size: 3,
				type: "file",
			},
			{
				fileHeaderOffset: 1381,
				name: "tokenizer_2/special_tokens_map.json",
				size: 3,
				type: "file",
			},
			{
				fileHeaderOffset: 1497,
				name: "tokenizer_2/tokenizer_config.json",
				size: 3,
				type: "file",
			},
			{
				fileHeaderOffset: 1611,
				name: "tokenizer_2/spiece.gguf",
				size: 0,
				type: "file",
			},
			{
				fileHeaderOffset: 1712,
				name: "tokenizer/",
				size: 0,
				type: "file",
			},
			{
				fileHeaderOffset: 1800,
				name: "tokenizer/vocab.json",
				size: 3,
				type: "file",
			},
			{
				fileHeaderOffset: 1901,
				name: "tokenizer/special_tokens_map.json",
				size: 3,
				type: "file",
			},
			{
				fileHeaderOffset: 2015,
				name: "tokenizer/tokenizer_config.json",
				size: 3,
				type: "file",
			},
			{
				fileHeaderOffset: 2127,
				name: "scheduler/",
				size: 0,
				type: "file",
			},
			{
				fileHeaderOffset: 2215,
				name: "scheduler/scheduler-config.json",
				size: 3,
				type: "file",
			},
			{
				fileHeaderOffset: 2327,
				name: "text_encoder/",
				size: 0,
				type: "file",
			},
			{
				fileHeaderOffset: 2418,
				name: "text_encoder/config.json",
				size: 3,
				type: "file",
			},
			{
				fileHeaderOffset: 2523,
				name: "text_encoder/model-00002-of-00002.safetensors",
				size: 0,
				type: "file",
			},
			{
				fileHeaderOffset: 2646,
				name: "text_encoder/models.saftensors.index.json",
				size: 3,
				type: "file",
			},
			{
				fileHeaderOffset: 2768,
				name: "text_encoder/model-00001-of-00002.safetensors",
				size: 0,
				type: "file",
			},
		]);
	});
});
