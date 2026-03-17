import { describe, expect, it } from "vitest";
import { getOnnxDtypes } from "./list-onnx-dtypes";

describe("getOnnxDtypes", () => {
	it("encoder-only model: single base name, multiple dtypes", () => {
		const filePaths = [
			"onnx/model.onnx",
			"onnx/model_fp16.onnx",
			"onnx/model_q4.onnx",
			"onnx/model_quantized.onnx",
		];
		expect(getOnnxDtypes({ filePaths, baseNames: ["model"] })).toEqual(["fp32", "fp16", "q8", "q4"]);
	});

	it("seq2seq model: dtype only reported when all base names present", () => {
		const filePaths = [
			"onnx/encoder_model.onnx",
			"onnx/encoder_model_fp16.onnx",
			"onnx/decoder_model.onnx",
			"onnx/decoder_model_fp16.onnx",
			"onnx/decoder_model_q4.onnx", // encoder missing q4
		];
		expect(getOnnxDtypes({ filePaths, baseNames: ["encoder_model", "decoder_model"] })).toEqual(["fp32", "fp16"]);
	});

	it("auto-discovery mode (no baseNames): returns all found dtypes", () => {
		const filePaths = ["onnx/model.onnx", "onnx/model_fp16.onnx", "onnx/other_int8.onnx"];
		expect(getOnnxDtypes({ filePaths })).toEqual(["fp32", "fp16", "int8"]);
	});

	it("empty file list returns []", () => {
		expect(getOnnxDtypes({ filePaths: [] })).toEqual([]);
	});

	it("non-onnx files are ignored", () => {
		const filePaths = [
			"onnx/model.onnx_data",
			"onnx/config.json",
			"README.md",
			"model.safetensors",
			"onnx/model.onnx",
		];
		expect(getOnnxDtypes({ filePaths })).toEqual(["fp32"]);
	});

	it("custom subfolder", () => {
		const filePaths = ["custom/model.onnx", "custom/model_fp16.onnx", "onnx/model_q4.onnx"];
		expect(getOnnxDtypes({ filePaths, subfolder: "custom" })).toEqual(["fp32", "fp16"]);
	});

	it("suffix disambiguation: _q4 vs _q4f16", () => {
		const filePaths = ["onnx/model_q4.onnx", "onnx/model_q4f16.onnx"];
		expect(getOnnxDtypes({ filePaths })).toEqual(["q4", "q4f16"]);
	});

	it("returns dtypes in mapping order (fp32 first)", () => {
		const filePaths = ["onnx/model_q4.onnx", "onnx/model.onnx", "onnx/model_fp16.onnx"];
		expect(getOnnxDtypes({ filePaths })).toEqual(["fp32", "fp16", "q4"]);
	});
});
