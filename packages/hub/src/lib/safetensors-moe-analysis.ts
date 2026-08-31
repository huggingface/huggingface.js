import { computeTensorParameterCount, isRoutedExpertTensor } from "./safetensors-parameter-analysis";
import type {
	ModelConfig,
	MoeConfigFields,
	MoeInfo,
	SafetensorsFileHeader,
	TensorInfo,
} from "./safetensors-analysis-types";

/**
 * Pure MoE inference over parsed headers plus a model config. Unsupported or partial
 * layouts return `undefined`; repository I/O and scope policy stay in the parser façade.
 */

type ResolvedMoeConfig = Pick<MoeInfo, "topK" | "numExperts" | "hasSharedExpert">;

function isPositiveSafeInteger(value: unknown): value is number {
	return typeof value === "number" && Number.isSafeInteger(value) && value > 0;
}

function firstPositiveSafeInteger(values: unknown[]): number | undefined {
	return values.find(isPositiveSafeInteger);
}

function getMoeConfig(config: ModelConfig | null): ResolvedMoeConfig | undefined {
	if (!config) {
		return undefined;
	}
	const sources: MoeConfigFields[] = [
		config,
		...(config.text_config ? [config.text_config] : []),
		...(config.ffn_config ? [config.ffn_config] : []),
	];
	for (const source of sources) {
		const topK = firstPositiveSafeInteger([
			source.num_experts_per_tok,
			source.num_experts_per_token,
			source.num_selected_experts,
			source.moe_k,
			source.moe_top_k,
		]);
		const numExperts = firstPositiveSafeInteger([
			source.num_local_experts,
			source.num_experts,
			source.n_routed_experts,
			source.moe_num_experts,
		]);
		const hasSharedExpert = [source.n_shared_experts, source.num_shared_experts, source.moe_num_shared_experts].some(
			isPositiveSafeInteger,
		);
		// Resolve both values from one config object. Mixing a partial multimodal root config
		// with unrelated `text_config` fields can manufacture a plausible but false pair.
		if (topK !== undefined && numExperts !== undefined && topK <= numExperts) {
			return { topK, numExperts, hasSharedExpert };
		}
	}
	return undefined;
}

/**
 * Decide whether a tensor belongs to a *routed* expert (one that is gated per token).
 * Shared/dense experts never match.
 *
 * Recognized layouts:
 *   - per-expert legacy: `…experts.{int}.…`             (Mixtral, Phi-MoE, OlMoE, Qwen-MoE, …)
 *   - per-expert with prefix: `…experts.expert_{int}.…` (Switch Transformers)
 *   - stacked 3D:        `…experts.<name>` where shape[0] === numExperts
 *                        (GPT-OSS, modern Mixtral/Qwen/Deepseek in-memory format, GraniteMoE, JetMoE)
 */
function getPerExpertIndex(name: string): number | null {
	const match = /\.experts\.(?:expert_)?(\d+)\./.exec(name);
	return match ? Number(match[1]) : null;
}

function isMoeRoutedExpertTensor(name: string, info: TensorInfo, numExperts: number): boolean {
	if (!isRoutedExpertTensor(name)) {
		return false;
	}
	const expertIndex = getPerExpertIndex(name);
	if (expertIndex !== null) {
		return Number.isSafeInteger(expertIndex) && expertIndex < numExperts;
	}
	// Stacked layouts can use names such as `gate_up_proj.weight`, `down_proj_blocks`,
	// or `weight_packed`; the leading dimension, rather than a suffix allowlist, identifies them.
	if (info.shape[0] === numExperts) {
		return true;
	}
	// DBRX flattens the expert and intermediate dimensions into the leading dimension.
	return /\.experts\.mlp\.(?:w1|v1|w2)(?:\.|$)/.test(name) && info.shape[0] % numExperts === 0;
}

export function computeMoeInfoFromHeaders(
	headers: Iterable<SafetensorsFileHeader>,
	config: ModelConfig | null,
): MoeInfo | undefined {
	const moeConfig = getMoeConfig(config);
	if (!moeConfig) {
		return undefined;
	}
	const quantConfig = config?.quantization_config ?? config?.text_config?.quantization_config;
	const expertDtype = config?.expert_dtype ?? config?.text_config?.expert_dtype;

	let total = 0;
	let routedExpert = 0;
	let hasSharedExpert = moeConfig.hasSharedExpert;
	let hasStackedExperts = false;
	const perExpertIndices = new Set<number>();

	for (const header of headers) {
		for (const [name, value] of Object.entries(header)) {
			if (name === "__metadata__") {
				continue;
			}
			const info = value as TensorInfo;
			const parameterCount = computeTensorParameterCount(name, info, quantConfig, expertDtype);
			if (parameterCount === 0) {
				continue;
			}
			const expertIndex = getPerExpertIndex(name);
			if (expertIndex !== null && (!Number.isSafeInteger(expertIndex) || expertIndex >= moeConfig.numExperts)) {
				// A tensor/config mismatch means dividing by the configured expert count is unsafe.
				return undefined;
			}
			total += parameterCount;
			if (isMoeRoutedExpertTensor(name, info, moeConfig.numExperts)) {
				routedExpert += parameterCount;
				if (expertIndex === null) {
					hasStackedExperts = true;
				} else {
					perExpertIndices.add(expertIndex);
				}
			} else if (name.includes("shared_expert")) {
				hasSharedExpert = true;
			}
		}
	}

	if (routedExpert === 0) {
		// Config says MoE but tensors do not look like a supported routed-expert layout.
		return undefined;
	}
	if (!hasStackedExperts && perExpertIndices.size !== moeConfig.numExperts) {
		// A partial expert set (for example, one non-standard shard filename) cannot produce
		// a model-level average per expert reliably.
		return undefined;
	}

	const perExpert = routedExpert / moeConfig.numExperts;
	const alwaysActive = total - routedExpert;
	const active = alwaysActive + moeConfig.topK * perExpert;

	return {
		numExperts: moeConfig.numExperts,
		topK: moeConfig.topK,
		perExpert,
		alwaysActive,
		active,
		hasSharedExpert,
	};
}
