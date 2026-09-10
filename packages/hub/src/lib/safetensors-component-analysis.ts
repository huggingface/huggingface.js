import { omit } from "../utils/omit";
import { typedEntries } from "../utils/typedEntries";
import type {
	ComponentConfigFields,
	ModelConfig,
	SafetensorsFileHeader,
	SafetensorsParameterComponent,
	SafetensorsParameterCountByComponent,
} from "./safetensors-analysis-types";
import {
	computeTensorParameterCount,
	getMlxQuantizedModules,
	getModelQuantizationConfig,
} from "./safetensors-parameter-analysis";

/**
 * Pure component attribution for parsed Safetensors headers.
 *
 * Tensor names establish ownership boundaries while config fields establish semantics. In
 * particular, `mtp.*` is only called DSpark when the config declares DSpark; the same namespace
 * is ordinary MTP in Qwen checkpoints.
 */

export type SafetensorsComponentClassifier = (tensorName: string) => SafetensorsParameterComponent;

function isPositiveSafeInteger(value: unknown): value is number {
	return typeof value === "number" && Number.isSafeInteger(value) && value > 0;
}

function hasNonEmptyIntegerList(value: unknown): boolean {
	return (
		Array.isArray(value) &&
		value.length > 0 &&
		value.every((item) => Number.isSafeInteger(item) && typeof item === "number" && item >= 0)
	);
}

function getConfigSources(config: ModelConfig): ComponentConfigFields[] {
	return [config, ...(config.text_config ? [config.text_config] : [])];
}

function getModelTypes(config: ModelConfig): string[] {
	return getConfigSources(config)
		.map((source) => source.model_type)
		.filter((value): value is string => typeof value === "string");
}

function getArchitectures(config: ModelConfig): string[] {
	return getConfigSources(config).flatMap((source) =>
		Array.isArray(source.architectures)
			? source.architectures.filter((value): value is string => typeof value === "string")
			: [],
	);
}

function getStandaloneSpeculator(config: ModelConfig): SafetensorsParameterComponent | undefined {
	const modelTypes = getModelTypes(config);
	const architectures = getArchitectures(config);

	// MuseGlimmerAssistant is the canonical Transformers DFlash implementation. Other DFlash
	// checkpoints often use generic decoder tensor names, so the config identity is essential.
	if (
		modelTypes.includes("muse_glimmer_assistant") ||
		architectures.some((architecture) => /(?:MuseGlimmerAssistant|DFlash)/i.test(architecture))
	) {
		return "dflash";
	}
	// EAGLE3 checkpoints likewise use generic names such as `midlayer.*`, `fc.weight`, and
	// `lm_head.weight`; their architecture tag is the only dependable local signal.
	if (
		modelTypes.some((modelType) => /eagle3/i.test(modelType)) ||
		architectures.some((architecture) => /eagle3/i.test(architecture))
	) {
		return "eagle3";
	}
	return undefined;
}

export function createSafetensorsComponentClassifier(
	config: ModelConfig | null,
): SafetensorsComponentClassifier | undefined {
	if (!config) {
		return undefined;
	}

	const standaloneSpeculator = getStandaloneSpeculator(config);
	if (standaloneSpeculator) {
		return () => standaloneSpeculator;
	}

	const sources = getConfigSources(config);
	const modelTypes = getModelTypes(config);
	const architectures = getArchitectures(config);
	const isQwen4Exp =
		modelTypes.some((modelType) => modelType === "qwen4_exp" || modelType === "qwen4_exp_text") ||
		architectures.some((architecture) => /^Qwen4Exp/.test(architecture));
	const isDeepseekV41 =
		modelTypes.some((modelType) => modelType === "deepseek_v41" || modelType === "deepseek_v41_text") ||
		architectures.some((architecture) => /^DeepseekV41/.test(architecture));
	const hasMtp = sources.some((source) =>
		[source.num_mtp_layers, source.mtp_num_hidden_layers, source.num_nextn_predict_layers].some(isPositiveSafeInteger),
	);
	const hasNgram = sources.some(
		(source) => isPositiveSafeInteger(source.ngram_size) && hasNonEmptyIntegerList(source.ple_layer_ids),
	);
	const hasEngram = sources.some((source) => hasNonEmptyIntegerList(source.engram_layer_ids));
	const hasDspark = sources.some((source) => isPositiveSafeInteger(source.dspark_block_size));
	const hasVision = typeof config.vision_config === "object" && config.vision_config !== null;

	if (!isQwen4Exp && !isDeepseekV41 && !hasMtp && !hasNgram && !hasEngram && !hasDspark) {
		return undefined;
	}

	return (tensorName) => {
		if (isDeepseekV41) {
			if (hasEngram && /^layers\.\d+\.engram\./.test(tensorName)) {
				return "engram";
			}
			if (hasDspark && /^mtp\./.test(tensorName)) {
				return "dspark";
			}
			if (hasVision && (/^(?:vision|aligner)\./.test(tensorName) || /^image_(?:start|end|newline)$/.test(tensorName))) {
				return "vision";
			}
		}

		if (isQwen4Exp) {
			if (hasNgram && /^model\.language_model\.layers\.\d+\.ple\./.test(tensorName)) {
				return "ngram";
			}
			if (hasMtp && /^mtp\./.test(tensorName)) {
				return "mtp";
			}
			if (hasVision && /^model\.visual\./.test(tensorName)) {
				return "vision";
			}
		}

		if (hasDspark && /(?:^|\.)mtp\./.test(tensorName)) {
			return "dspark";
		}
		if (hasMtp && /(?:^|\.)mtp\./.test(tensorName)) {
			return "mtp";
		}
		if (hasEngram && /(?:^|\.)engram\./.test(tensorName)) {
			return "engram";
		}
		if (hasNgram && /(?:^|\.)ngram_embedding\./.test(tensorName)) {
			return "ngram";
		}
		return "backbone";
	};
}

export function computeParameterCountByComponent(
	headers: Iterable<SafetensorsFileHeader>,
	config: ModelConfig | null,
): SafetensorsParameterCountByComponent | undefined {
	const classify = createSafetensorsComponentClassifier(config);
	if (!classify || !config) {
		return undefined;
	}

	const headerList = [...headers];
	const quantConfig = getModelQuantizationConfig(config) ?? getModelQuantizationConfig(config.text_config ?? null);
	const expertDtype = quantConfig?.expert_dtype ?? config.expert_dtype ?? config.text_config?.expert_dtype;
	const mlxQuantizedModules = getMlxQuantizedModules(headerList, quantConfig);
	const counts: SafetensorsParameterCountByComponent = {};

	for (const header of headerList) {
		for (const [tensorName, value] of typedEntries(omit(header, "__metadata__"))) {
			const parameterCount = computeTensorParameterCount(
				tensorName,
				value,
				quantConfig,
				expertDtype,
				mlxQuantizedModules,
			);
			if (parameterCount === 0) {
				continue;
			}
			const component = classify(tensorName);
			counts[component] = (counts[component] ?? 0) + parameterCount;
		}
	}

	const hasSpecialComponent = Object.keys(counts).some((component) => component !== "backbone");
	return hasSpecialComponent ? counts : undefined;
}
