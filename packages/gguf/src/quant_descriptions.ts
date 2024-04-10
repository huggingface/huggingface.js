import { GGMLQuantizationType } from "./types";

export const QUANT_DESCRIPTIONS: Record<GGMLQuantizationType, string> = {
	[GGMLQuantizationType.F32]: "32-bit standard IEEE 754 single-precision floating-point number.", // src: https://en.wikipedia.org/wiki/Single-precision_floating-point_format
	[GGMLQuantizationType.F16]: "16-bit standard IEEE 754 half-precision floating-point number.", // src: https://en.wikipedia.org/wiki/Half-precision_floating-point_format
	[GGMLQuantizationType.Q4_0]: "4-bit round-to-nearest quantization (q). Each block has 32 weights. Weights are obtained by w = q * block_scale_factor. Legacy quantization method (not used widely as of today)",
	[GGMLQuantizationType.Q4_1]: "4-bit round-to-nearest quantization (q). Each block has 32 weights. Weights are obtained by w = q * block_scale_factor + block_minimum. Legacy quantization method (not used widely as of today)",
	[GGMLQuantizationType.Q5_0]: "5-bit round-to-nearest quantization (q). Each block has 32 weights. Weights are obtained by w = q * block_scale_factor. Legacy quantization method (not used widely as of today)",
	[GGMLQuantizationType.Q5_1]: "5-bit round-to-nearest quantization (q). Each block has 32 weights. Weights are obtained by w = q * block_scale_factor + block_minimum. Legacy quantization method (not used widely as of today)",
	[GGMLQuantizationType.Q8_0]: "8-bit round-to-nearest quantization (q). Each block has 32 weights. Weights are obtained by w = q * block_scale_factor. Legacy quantization method (not used widely as of today)",
	[GGMLQuantizationType.Q8_1]: "8-bit round-to-nearest quantization (q). Each block has 32 weights. Weights are obtained by w = q * block_scale_factor + block_minimum. Legacy quantization method (not used widely as of today)",
	[GGMLQuantizationType.Q2_K]: `2-bit quantization (q). Super-blocks with 16 blocks, each block has 16 weight. Block scales (d) & mins (m) are quantized with 4 bits, resulting in 2.5625 bits-per-weight. Weights are obtained by w = d * q + m.`, // src: https://github.com/ggerganov/llama.cpp/pull/1684#issue-1739619305
	[GGMLQuantizationType.Q3_K]: `3-bit quantization (q). Super-blocks with 16 blocks, each block has 16 weights. Block scales (d) is quantized with 6 bits, resulting. 3.4375 bits-per-weight. Weights are obtained by w = d * q.`, // src: https://github.com/ggerganov/llama.cpp/pull/1684#issue-1739619305
	[GGMLQuantizationType.Q4_K]: `4-bit quantization (q). Super-blocks with 8 blocks, each block has 32 weights. Block scales (d) & mins (m) are quantized with 6 bits, resulting. 4.5 bits-per-weight are obtained by w = d * q + m.`, // src: https://github.com/ggerganov/llama.cpp/pull/1684#issue-1739619305
	[GGMLQuantizationType.Q5_K]: `5-bit quantization (q). Super-blocks with 8 blocks, each block has 32 weights. Block scales (d) & mins (m) are quantized with 6 bits, resulting in 5.5 bits-per-weight. Weights are obtained by w = d * q + m.`, // src: https://github.com/ggerganov/llama.cpp/pull/1684#issue-1739619305
	[GGMLQuantizationType.Q6_K]: `6-bit quantization (q). Super-blocks with 16 blocks, each block has 16 weights. Block scales (d) is quantized with 8 bits, resulting in 6.5625 bits-per-weight. Weights are obtained by w = d * q.`, // src: https://github.com/ggerganov/llama.cpp/pull/1684#issue-1739619305
	[GGMLQuantizationType.Q8_K]: `8-bit quantization (q). Each block has 256 weights. Only used for quantizing intermediate results. All 2-6 bit dot products are implemented for this quantization type. Weights are obtained by w = q * block_scale_factor.`, // src: https://github.com/ggerganov/llama.cpp/pull/1684#issue-1739619305
	[GGMLQuantizationType.IQ2_XXS]: "", // todo: add description
	[GGMLQuantizationType.IQ2_XS]: "", // todo: add description
	[GGMLQuantizationType.IQ3_XXS]: "", // todo: add description
	[GGMLQuantizationType.IQ1_S]: "", // todo: add description
	[GGMLQuantizationType.IQ4_NL]: "", // todo: add description
	[GGMLQuantizationType.IQ3_S]: "", // todo: add description
	[GGMLQuantizationType.IQ2_S]: "", // todo: add description
	[GGMLQuantizationType.IQ4_XS]: "", // todo: add description
};