import type { TransformerLLM } from "./transformer-llm";
import { LLM_ARCHITECTURES } from "./transformer-llm";

export type MetadataBaseValue = string | number | bigint | boolean;
export type MetadataValue = MetadataBaseValue | MetadataBaseValue[] | MetadataValue[]; /// recursive as arrays can be nested.

export type Version = 1 | 2 | 3;

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

const ARCHITECTURES = [...LLM_ARCHITECTURES, "rwkv", "whisper"];
export type Architecture = (typeof ARCHITECTURES)[number];

interface General {
	"general.architecture": Architecture;
	"general.name": string;
	"general.file_type": number;
	"general.quantization_version": number;
}

export type ModelBase<
	TArchitecture extends
		| Architecture
		| `encoder.${Extract<Architecture, "whisper">}`
		| `decoder.${Extract<Architecture, "whisper">}`,
> = { [K in `${TArchitecture}.layer_count`]: number } & { [K in `${TArchitecture}.feed_forward_length`]: number } & {
	[K in `${TArchitecture}.context_length`]: number;
} & { [K in `${TArchitecture}.embedding_length`]: number } & { [K in `${TArchitecture}.block_count`]: number };

type TokenizerModel = "no_vocab" | "llama" | "gpt2" | "bert";
interface Tokenizer {
	"tokenizer.ggml.model": TokenizerModel;
	"tokenizer.ggml.tokens": string[];
	"tokenizer.ggml.scores": number[];
	"tokenizer.ggml.token_type": number[];
	"tokenizer.ggml.bos_token_id": number;
	"tokenizer.ggml.eos_token_id": number;
	"tokenizer.ggml.add_bos_token": boolean;
	"tokenizer.chat_template": string;
}

export type RWKV = ModelBase<"rwkv"> & { "rwkv.architecture_version": number };
export type LLM = TransformerLLM | RWKV;
export type Whisper = ModelBase<"encoder.whisper"> & ModelBase<"decoder.whisper">;
export type Model = (LLM | Whisper) & Partial<Tokenizer>;

export type GGUFMetadata = {
	version: Version;
	tensor_count: bigint;
	kv_count: bigint;
} & Partial<General> &
	Partial<Model> &
	Record<string, MetadataValue>;

export interface GGUFTensorInfo {
	name: string;
	n_dims: number;
	shape: bigint[];
	dtype: GGMLQuantizationType;
	offset: bigint;
}

export interface GGUFParseOutput {
	metadata: GGUFMetadata;
	tensorInfos: GGUFTensorInfo[];
}
