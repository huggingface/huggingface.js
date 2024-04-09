import { GGMLQuantizationType } from "./types";

export const QUANT_DESCRIPTIONS: Record<GGMLQuantizationType, string> = {
	[GGMLQuantizationType.F32]: "32-bit standard IEEE 754 single-precision floating-point number.", // src: https://en.wikipedia.org/wiki/Single-precision_floating-point_format
	[GGMLQuantizationType.F16]: "16-bit standard IEEE 754 half-precision floating-point number.", // src: https://en.wikipedia.org/wiki/Half-precision_floating-point_format
	[GGMLQuantizationType.Q4_0]: "", // todo: add description
	[GGMLQuantizationType.Q4_1]: "", // todo: add description
	[GGMLQuantizationType.Q5_0]: "", // todo: add description
	[GGMLQuantizationType.Q5_1]: "", // todo: add description
	[GGMLQuantizationType.Q8_0]: "", // todo: add description
	[GGMLQuantizationType.Q8_1]: "", // todo: add description
	[GGMLQuantizationType.Q2_K]: `"type-1" 2-bit quantization in super-blocks containing 16 blocks, each block having 16 weight. Block scales and mins are quantized with 4 bits. This ends up effectively using 2.5625 bits per weight (bpw). In "type-1", weights are given by w = d * q + m, where m is the block minimum.`, // src: https://github.com/ggerganov/llama.cpp/pull/1684#issue-1739619305
	[GGMLQuantizationType.Q3_K]: `"type-0" 3-bit quantization in super-blocks containing 16 blocks, each block having 16 weights. Scales are quantized with 6 bits. This end up using 3.4375 bpw. In "type-0", weights w are obtained from quants q using w = d * q, where d is the block scale.`, // src: https://github.com/ggerganov/llama.cpp/pull/1684#issue-1739619305
	[GGMLQuantizationType.Q4_K]: `"type-1" 4-bit quantization in super-blocks containing 8 blocks, each block having 32 weights. Scales and mins are quantized with 6 bits. This ends up using 4.5 bpw. In "type-1", weights are given by w = d * q + m, where m is the block minimum.`, // src: https://github.com/ggerganov/llama.cpp/pull/1684#issue-1739619305
	[GGMLQuantizationType.Q5_K]: `"type-1" 5-bit quantization. Same super-block structure as Q4_K resulting in 5.5 bpw. In "type-1", weights are given by w = d * q + m, where m is the block minimum.`, // src: https://github.com/ggerganov/llama.cpp/pull/1684#issue-1739619305
	[GGMLQuantizationType.Q6_K]: `"type-0" 6-bit quantization. Super-blocks with 16 blocks, each block having 16 weights. Scales are quantized with 8 bits. This ends up using 6.5625 bpw. In "type-0", weights w are obtained from quants q using w = d * q, where d is the block scale.`, // src: https://github.com/ggerganov/llama.cpp/pull/1684#issue-1739619305
	[GGMLQuantizationType.Q8_K]: `"type-0" 8-bit quantization. Only used for quantizing intermediate results. The difference to the existing Q8_0 is that the block size is 256. All 2-6 bit dot products are implemented for this quantization type. In "type-0", weights w are obtained from quants q using w = d * q, where d is the block scale.`, // src: https://github.com/ggerganov/llama.cpp/pull/1684#issue-1739619305
	[GGMLQuantizationType.IQ2_XXS]: "", // todo: add description
	[GGMLQuantizationType.IQ2_XS]: "", // todo: add description
	[GGMLQuantizationType.IQ3_XXS]: "", // todo: add description
	[GGMLQuantizationType.IQ1_S]: "", // todo: add description
	[GGMLQuantizationType.IQ4_NL]: "", // todo: add description
	[GGMLQuantizationType.IQ3_S]: "", // todo: add description
	[GGMLQuantizationType.IQ2_S]: "", // todo: add description
	[GGMLQuantizationType.IQ4_XS]: "", // todo: add description
};
