import { describe, expect, it } from "vitest";
import { parseOnnxDtypes } from "./parse-onnx-dtypes";

describe("parseOnnxDtypes", () => {
	it("encoder-only model: single base name, multiple dtypes", () => {
		const filePaths = [
			"onnx/model.onnx",
			"onnx/model_fp16.onnx",
			"onnx/model_q4.onnx",
			"onnx/model_quantized.onnx",
		];
		expect(parseOnnxDtypes({ filePaths })).toEqual(["fp32", "fp16", "q8", "q4"]);
	});

	it("seq2seq model: dtype only reported when all parts present", () => {
		const filePaths = [
			"onnx/encoder_model.onnx",
			"onnx/encoder_model_fp16.onnx",
			"onnx/decoder_model.onnx",
			"onnx/decoder_model_fp16.onnx",
			"onnx/decoder_model_q4.onnx", // encoder missing q4
		];
		expect(parseOnnxDtypes({ filePaths })).toEqual(["fp32", "fp16"]);
	});

	it("empty file list returns []", () => {
		expect(parseOnnxDtypes({ filePaths: [] })).toEqual([]);
	});

	it("non-onnx files are ignored", () => {
		const filePaths = [
			"onnx/model.onnx_data",
			"onnx/config.json",
			"README.md",
			"model.safetensors",
			"onnx/model.onnx",
		];
		expect(parseOnnxDtypes({ filePaths })).toEqual(["fp32"]);
	});

	it("custom subfolder", () => {
		const filePaths = ["custom/model.onnx", "custom/model_fp16.onnx", "onnx/model_q4.onnx"];
		expect(parseOnnxDtypes({ filePaths, subfolder: "custom" })).toEqual(["fp32", "fp16"]);
	});

	it("suffix disambiguation: _q4 vs _q4f16", () => {
		const filePaths = ["onnx/model_q4.onnx", "onnx/model_q4f16.onnx"];
		expect(parseOnnxDtypes({ filePaths })).toEqual(["q4", "q4f16"]);
	});

	it("returns dtypes in mapping order (fp32 first)", () => {
		const filePaths = ["onnx/model_q4.onnx", "onnx/model.onnx", "onnx/model_fp16.onnx"];
		expect(parseOnnxDtypes({ filePaths })).toEqual(["fp32", "fp16", "q4"]);
	});
});
