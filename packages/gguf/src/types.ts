import type { TransformerLLM } from "./transformer-llm";
import { LLM_ARCHITECTURES } from "./transformer-llm";

export type MetadataBaseValue = string | number | bigint | boolean;
export type MetadataValue = MetadataBaseValue | MetadataBaseValue[] | MetadataValue[]; /// recursive as arrays can be nested.

export type Version = 1 | 2 | 3;

export enum GGMLFileQuantizationType {
	MOSTLY_F32 = 0,
	MOSTLY_F16 = 1,
	MOSTLY_Q4_0 = 2,
	MOSTLY_Q4_1 = 3,
	MOSTLY_Q4_1_SOME_F16 = 4, // tok_embeddings.weight and output.weight are F16
	// MOSTLY_Q4_2 = 5,  // support has been removed
	// MOSTLY_Q4_3 = 6,  // support has been removed
	MOSTLY_Q8_0 = 7,
	MOSTLY_Q5_0 = 8,
	MOSTLY_Q5_1 = 9,
	MOSTLY_Q2_K = 10,
	MOSTLY_Q3_K_S = 11,
	MOSTLY_Q3_K_M = 12,
	MOSTLY_Q3_K_L = 13,
	MOSTLY_Q4_K_S = 14,
	MOSTLY_Q4_K_M = 15,
	MOSTLY_Q5_K_S = 16,
	MOSTLY_Q5_K_M = 17,
	MOSTLY_Q6_K = 18,
	MOSTLY_IQ2_XXS = 19,
	MOSTLY_IQ2_XS = 20,
	MOSTLY_Q2_K_S = 21,
	MOSTLY_IQ3_XS = 22,
	MOSTLY_IQ3_XXS = 23,
	MOSTLY_IQ1_S = 24,
	MOSTLY_IQ4_NL = 25,
	MOSTLY_IQ3_S = 26,
	MOSTLY_IQ3_M = 27,
	MOSTLY_IQ2_S = 28,
	MOSTLY_IQ2_M = 29,
	MOSTLY_IQ4_XS = 30,
	MOSTLY_IQ1_M = 31,
	MOSTLY_BF16 = 32,
	MOSTLY_Q4_0_4_4 = 33,
	MOSTLY_Q4_0_4_8 = 34,
	MOSTLY_Q4_0_8_8 = 35,
}

export enum GGMLQuantizationType {
	F32 = 0,
	F16 = 1,
	Q4_0 = 2,
	Q4_1 = 3,
	Q5_0 = 6,
	Q5_1 = 7,
	Q8_0 = 8,
	Q8_1 = 9,
	Q2_K = 10,
	Q3_K = 11,
	Q4_K = 12,
	Q5_K = 13,
	Q6_K = 14,
	Q8_K = 15,
	IQ2_XXS = 16,
	IQ2_XS = 17,
	IQ3_XXS = 18,
	IQ1_S = 19,
	IQ4_NL = 20,
	IQ3_S = 21,
	IQ2_S = 22,
	IQ4_XS = 23,
	I8 = 24,
	I16 = 25,
	I32 = 26,
	I64 = 27,
	F64 = 28,
	IQ1_M = 29,
	BF16 = 30,
}

export enum GGUFValueType {
	UINT8 = 0,
	INT8 = 1,
	UINT16 = 2,
	INT16 = 3,
	UINT32 = 4,
	INT32 = 5,
	FLOAT32 = 6,
	BOOL = 7,
	STRING = 8,
	ARRAY = 9,
	UINT64 = 10,
	INT64 = 11,
	FLOAT64 = 12,
}

const ARCHITECTURES = [...LLM_ARCHITECTURES, "rwkv", "whisper"] as const;
export type Architecture = (typeof ARCHITECTURES)[number];

export interface GGUFGeneralInfo<TArchitecture extends Architecture> {
	"general.architecture": TArchitecture;
	"general.name"?: string;
	"general.file_type"?: GGMLFileQuantizationType;
	"general.quantization_version"?: number;
}

type ModelMetadata = Whisper | RWKV | TransformerLLM;
interface NoModelMetadata {
	"general.architecture"?: undefined;
}

export type ModelBase<
	TArchitecture extends
		| Architecture
		| `encoder.${Extract<Architecture, "whisper">}`
		| `decoder.${Extract<Architecture, "whisper">}`,
> = Record<
	| `${TArchitecture}.context_length`
	| `${TArchitecture}.block_count`
	| `${TArchitecture}.embedding_length`
	| `${TArchitecture}.feed_forward_length`,
	number
>;

/// Tokenizer

type TokenizerModel = "no_vocab" | "llama" | "gpt2" | "bert";
interface Tokenizer {
	"tokenizer.ggml.model": TokenizerModel;
	"tokenizer.ggml.tokens": string[];
	"tokenizer.ggml.scores": number[];
	"tokenizer.ggml.token_type": number[];
	"tokenizer.ggml.bos_token_id": number;
	"tokenizer.ggml.eos_token_id": number;
	"tokenizer.ggml.add_bos_token": boolean;
	"tokenizer.chat_template"?: string;
}
interface NoTokenizer {
	"tokenizer.ggml.model"?: undefined;
}

/// Models outside of llama.cpp: "rwkv" and "whisper"

export type RWKV = GGUFGeneralInfo<"rwkv"> &
	ModelBase<"rwkv"> & {
		"rwkv.architecture_version": number;
	};

// TODO: whisper.cpp doesn't yet support gguf. This maybe changed in the future.
export type Whisper = GGUFGeneralInfo<"whisper"> &
	ModelBase<"encoder.whisper"> &
	ModelBase<"decoder.whisper"> & {
		"whisper.encoder.mels_count": number;
		"whisper.encoder.attention.head_count": number;
		"whisper.decoder.attention.head_count": number;
	};

/// Types for parse output

export interface GGUFMetadataOptions {
	/**
	 * Enable strict type for known GGUF fields.
	 *
	 * @default true
	 */
	strict: boolean;
}

export type GGUFMetadata<Options extends GGUFMetadataOptions = { strict: true }> = {
	version: Version;
	tensor_count: bigint;
	kv_count: bigint;
} & GGUFModelKV &
	(Options extends { strict: true } ? unknown : Record<string, MetadataValue>);

export type GGUFModelKV = (NoModelMetadata | ModelMetadata) & (NoTokenizer | Tokenizer);

export interface GGUFTensorInfo {
	name: string;
	n_dims: number;
	shape: bigint[];
	dtype: GGMLQuantizationType;
	offset: bigint;
}

export interface GGUFParseOutput<Options extends GGUFMetadataOptions = { strict: true }> {
	metadata: GGUFMetadata<Options>;
	tensorInfos: GGUFTensorInfo[];
}
