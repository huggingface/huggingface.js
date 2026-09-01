export type TensorName = string;

export type Dtype =
	| "F64"
	| "F32"
	| "C64"
	| "F16"
	| "F8_E4M3"
	| "F8_E4M3FNUZ"
	| "F8_E5M2"
	| "F8_E5M2FNUZ"
	| "F8_E8M0"
	| "E8M0"
	| "F6_E3M2"
	| "F6_E2M3"
	| "F4"
	| "FP4"
	| "BF16"
	| "I64"
	| "U64"
	| "I32"
	| "U32"
	| "I16"
	| "I8"
	| "U16"
	| "U8"
	| "UE8"
	| "BOOL";

export interface TensorInfo {
	dtype: Dtype;
	shape: number[];
	data_offsets: [number, number];
}

export type SafetensorsFileHeader = Record<TensorName, TensorInfo> & {
	__metadata__?: { total_parameters?: string | number } & Record<string, string>;
};

export interface SafetensorsIndexJson {
	dtype?: string;
	/// ^there's sometimes a dtype but it looks inconsistent.
	metadata?: { total_parameters?: string | number } & Record<string, string>;
	/// ^ why the naming inconsistency?
	/**
	 * Mapping of tensor name -> shard filename.
	 *
	 * Omitted when the index holds more than `MAX_WEIGHT_MAP_ENTRIES` tensors: such indexes are
	 * consumed in streaming mode and the map is never materialized, so that memory stays bounded
	 * (see `parse-safetensors-index.ts`). Every model below that threshold — i.e. all of them bar a
	 * couple of huge MoEs, which previously failed to parse outright — is unaffected.
	 *
	 * If you only need the shard list, use `filepaths` on the parse result instead.
	 */
	weight_map?: Record<TensorName, string>;
}

export type SafetensorsShardedHeaders = Record<string, SafetensorsFileHeader>;

export interface QuantizationConfig {
	quant_method?: string;
	modules_to_not_convert?: string[];
	bits?: number;
	load_in_4bit?: boolean;
	load_in_8bit?: boolean;
	// compressed-tensors specific
	format?: string;
	config_groups?: Record<string, { format?: string; targets?: string[]; weights?: { num_bits?: number } }>;
	/**
	 * compressed-tensors names its exclusion list `ignore` rather than `modules_to_not_convert`,
	 * using the same `re:`-prefixed target syntax as `config_groups[].targets`.
	 */
	ignore?: string[];
}

export interface MoeConfigFields {
	/** Common across Mixtral, Qwen2/3-MoE, Llama4, GPT-OSS, … */
	num_experts_per_tok?: number;
	/** Alternative spelling used by some checkpoints. */
	num_experts_per_token?: number;
	/** Switch Transformers spelling. */
	num_selected_experts?: number;
	num_local_experts?: number;
	num_experts?: number;
	/** DeepSeek family. */
	n_routed_experts?: number;
	/** Ernie 4.5 / DBRX spellings. */
	moe_k?: number;
	moe_top_k?: number;
	moe_num_experts?: number;
	/** Shared-expert aliases used by DeepSeek, Qwen, and Ernie families. */
	n_shared_experts?: number;
	num_shared_experts?: number;
	moe_num_shared_experts?: number;
}

interface TextModelConfig extends MoeConfigFields {
	quantization_config?: QuantizationConfig;
	expert_dtype?: string;
}

export interface ModelConfig extends MoeConfigFields {
	quantization_config?: QuantizationConfig;
	text_config?: TextModelConfig;
	/** DBRX stores its MoE dimensions in this nested object. */
	ffn_config?: MoeConfigFields;
	/**
	 * Some MoEs store their experts at a narrower precision than the rest of the model and declare
	 * it here, *outside* `quantization_config` (e.g. DeepSeek-V4 is `quant_method: "fp8"` for
	 * attention but `expert_dtype: "fp4"` for the experts, which dominate the parameter count).
	 */
	expert_dtype?: string;
}

/**
 * Active-parameter breakdown for Mixture-of-Experts models.
 *
 * For MoE models, only `topK` of `numExperts` routed experts run per token, so the
 * usable ("active") parameter count is much smaller than the total stored on disk.
 * `active = alwaysActive + topK * perExpert`. Counts use the same logical-parameter
 * rules as `parameterCount`: packed weights are expanded and quantization bookkeeping
 * tensors are excluded.
 */
export interface MoeInfo {
	numExperts: number;
	topK: number;
	/** Average parameter count per routed expert (= sum-of-routed / numExperts). */
	perExpert: number;
	/** Everything that runs on every token: embeddings, attention, norms, lm_head, router, shared experts, … */
	alwaysActive: number;
	/** alwaysActive + topK * perExpert */
	active: number;
	/** True when the model has a dense shared-expert MLP alongside routed experts (DeepSeek, Qwen-MoE, Command-A, …). */
	hasSharedExpert: boolean;
}
