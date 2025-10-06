import type { TransformerLLM } from "./transformer-llm";
import { LLM_ARCHITECTURES } from "./transformer-llm";
import type { GGMLQuantizationType, GGMLFileQuantizationType } from "@huggingface/tasks";
export { GGMLQuantizationType } from "@huggingface/tasks";

export type MetadataBaseValue = string | number | bigint | boolean;
export type MetadataValue = MetadataBaseValue | MetadataBaseValue[] | MetadataValue[]; /// recursive as arrays can be nested.

export type Version = 1 | 2 | 3;

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

export type GGUFTypedMetadata = {
	version: {
		value: Version;
		type: GGUFValueType.UINT32;
	};
	tensor_count: {
		value: bigint;
		type: GGUFValueType.UINT32 | GGUFValueType.UINT64;
	};
	kv_count: {
		value: bigint;
		type: GGUFValueType.UINT32 | GGUFValueType.UINT64;
	};
} & {
	[K in keyof GGUFModelKV]?: {
		value: GGUFModelKV[K];
		type: GGUFValueType;
		subType?: GGUFValueType;
	};
} & Record<
		string,
		{
			value: MetadataValue;
			type: GGUFValueType;
			subType?: GGUFValueType;
		}
	>;

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
	tensorDataOffset: bigint;
	littleEndian: boolean;
	tensorInfoByteRange: [number, number];
}
