import { omit } from "../utils/omit";
import { typedEntries } from "../utils/typedEntries";
import type {
	Dtype,
	QuantizationConfig,
	SafetensorsFileHeader,
	SafetensorsShardedHeaders,
	TensorInfo,
} from "./safetensors-analysis-types";

/**
 * Pure logical-parameter accounting for already-parsed Safetensors headers.
 * Repository I/O and header validation belong to the parser façade.
 */

const GPTQ_QWEIGHT_SUFFIX = "qweight";
const GPTQ_AWQ_AUXILIARY_SUFFIXES = ["qzeros", "g_idx", "scales"];

/**
 * Block/group scales and zero-points stored alongside quantized weights. They are quantization
 * bookkeeping, not model parameters, so counting them inflates the total — for a fine-grained
 * scheme there is one scale per 32 weights, which is a percent-level error on its own and masks
 * the much larger undercount from unpacked sub-byte weights.
 */
const QUANTIZATION_AUXILIARY_SUFFIXES = [
	// NB: a bare `.scale` / `.scales` is deliberately absent — some architectures have *learnable*
	// scale parameters under that name, and dropping those would undercount. The block scales that
	// do use it (e.g. DeepSeek-V4's `attn.wkv.scale`) are caught by SCALE_ONLY_DTYPES instead,
	// and GPTQ/AWQ `scales` is already handled by the gptq/awq branch below.
	"weight_scale",
	"weight_scale_inv",
	"weight_scale_2",
	"weight_global_scale",
	"weight_zero_point",
	"input_scale",
	"input_global_scale",
	"input_zero_point",
	"zero_point",
	// compressed-tensors records each packed tensor's logical shape alongside it; it's a 2-element
	// I32 tensor, so it was not only counted but multiplied by the packing factor.
	"weight_shape",
	// Activation-ordering permutation indices, emitted by the pack-quantized compressor whenever
	// `actorder: "group"`. One I32 index per input column, so — like `weight_shape` — it was both
	// counted and scaled by the packing factor.
	"weight_g_idx",
];

/**
 * MXFP4 block scales as gpt-oss names them: `..._blocks` holds the packed weights, `..._scales` the
 * per-32-element UE8M0 exponents. The separator is an underscore rather than a dot, so
 * `QUANTIZATION_AUXILIARY_SUFFIXES` cannot see them and they were counted as parameters — 3% of the
 * reported total for both gpt-oss sizes.
 */
const MXFP4_SCALES_SUFFIX = "_scales";

/**
 * bitsandbytes keeps its double-quantization state beside each 4-bit weight: `absmax` (one value
 * per 64-weight block), the nested quantization of those absmax values, and the NF4/FP4 lookup
 * table. All bookkeeping — and because they share the weight's U8 container they were also
 * multiplied by the 4-bit packing factor, the same double error `weight_shape` had.
 */
const BITSANDBYTES_AUXILIARY_SUFFIXES = ["absmax", "quant_map", "nested_absmax", "nested_quant_map"];

/** Serialized quant state, e.g. `weight.quant_state.bitsandbytes__nf4` / `...__fp4`. */
const BITSANDBYTES_QUANT_STATE_PREFIX = "bitsandbytes__";

/**
 * Exponent-only float formats. These exist solely to hold MX-style block scales (`scale_fmt`
 * `ue8m0` and friends), never weights, so they're never parameters regardless of tensor name.
 */
const SCALE_ONLY_DTYPES: ReadonlySet<string> = new Set(["F8_E8M0", "E8M0", "UE8"]);

/**
 * Width, in bits, of the integer container a sub-byte quantized weight is packed into.
 *
 * The packing factor is `containerBits / num_bits`, so this must follow the *storage* dtype:
 * GPTQ/AWQ pack 4-bit weights 8-per-`I32`, while MXFP4-style schemes pack them 2-per-`U8`/`I8`.
 * Assuming a 32-bit container for everything undercounts the latter by 4x.
 */
const INTEGER_CONTAINER_BITS: Partial<Record<Dtype, number>> = {
	U8: 8,
	I8: 8,
	U16: 16,
	I16: 16,
	U32: 32,
	I32: 32,
};

/**
 * Sub-byte weight formats that may appear in `expert_dtype` / a compressed-tensors format string.
 *
 * NB: no `fp6` entry — MXFP6 weights are stored in the native `F6_E2M3` / `F6_E3M2` safetensors
 * dtypes rather than packed into an integer container, so a 6-bit width here could only ever
 * produce a wrong multiplier.
 */
const SUB_BYTE_FORMAT_BITS: Array<[pattern: string, bits: number]> = [
	["nvfp4", 4],
	["mxfp4", 4],
	["fp4", 4],
	["int4", 4],
	["uint4", 4],
	["nf4", 4],
	["int2", 2],
];

/**
 * Whether a tensor belongs to a *routed* expert, which is what `expert_dtype` describes.
 *
 * MoEs place them under an `experts` container — `…ffn.experts.0.w1.weight`,
 * `…block_sparse_moe.experts.3.w2.weight_packed`. `shared_experts` are always-on dense layers
 * quantized like the rest of the model, so they're excluded.
 */
export function isRoutedExpertTensor(tensorName: string): boolean {
	return tensorName.includes(".experts.") && !tensorName.includes("shared_expert");
}

/** Reads a bit width out of a free-form format/dtype string, e.g. `"mxfp4-pack-quantized"` -> 4. */
function bitsFromFormatString(format: string | undefined): number | undefined {
	if (!format) {
		return undefined;
	}
	const normalized = format.toLowerCase();
	return SUB_BYTE_FORMAT_BITS.find(([pattern]) => normalized.includes(pattern))?.[1];
}

/**
 * Packing factor for `numBits` values inside `dtype`, or 1 when `dtype` isn't an integer container
 * (already-unpacked weights, e.g. an `F8_E4M3` fp8 tensor holds exactly one value per byte).
 *
 * The packing is dense across elements: the reference compressor stores
 * `ceil(cols * num_bits / containerBits)` containers per row, so a container holds exactly
 * `containerBits / num_bits` values — deliberately *not* floored, because that ratio isn't a whole
 * number for widths which don't divide the container. Flooring 3-bit-in-`I32` to 10 values instead
 * of 10.67 undercounts by 6%.
 *
 * Because of that `ceil`, the final column may be partly padding, so the result is an upper bound —
 * off by at most `containerBits / num_bits - 1` values per row.
 */
function packingFactor(dtype: Dtype, numBits: number | undefined): number {
	const containerBits = INTEGER_CONTAINER_BITS[dtype];
	if (!containerBits || !numBits || numBits <= 0 || numBits >= containerBits) {
		return 1;
	}
	return containerBits / numBits;
}

/**
 * @internal
 * Glob match without RegExp: splits pattern on `*` and checks that each literal
 * segment appears in order within `str`. Avoids RegExp entirely (no ReDoS risk,
 * no SyntaxError from attacker-controlled patterns in config.json).
 */
export function globMatch(pattern: string, str: string): boolean {
	const parts = pattern.split("*");

	if (parts.length === 1) {
		return pattern === str;
	}

	if (!str.startsWith(parts[0])) {
		return false;
	}
	let pos = parts[0].length;

	const lastPart = parts[parts.length - 1];
	if (!str.endsWith(lastPart)) {
		return false;
	}
	const end = str.length - lastPart.length;

	for (let i = 1; i < parts.length - 1; i++) {
		const idx = str.indexOf(parts[i], pos);
		if (idx === -1 || idx + parts[i].length > end) {
			return false;
		}
		pos = idx + parts[i].length;
	}

	return pos <= end;
}

/**
 * @internal
 * Matches a module name against a compressed-tensors target.
 *
 * Targets are either exact module names, class names (e.g. `"Linear"`, which we
 * cannot resolve from tensor names and therefore ignore), or Python regexes
 * prefixed with `re:`. To avoid evaluating attacker-controlled RegExp from
 * config.json (ReDoS, SyntaxError — see globMatch), we translate the common
 * regex subset (`.*` wildcard, `^`/`$` anchors, `\.` escapes) to globMatch and
 * treat targets using any other regex syntax as non-matching.
 */
export function matchesCompressedTensorsTarget(target: string, moduleName: string): boolean {
	if (!target.startsWith("re:")) {
		return target === moduleName;
	}
	let pattern = target.slice(3);
	// Python's re.match anchors at the start; only `$` anchors the end.
	if (pattern.startsWith("^")) {
		pattern = pattern.slice(1);
	}
	if (pattern.endsWith("$")) {
		pattern = pattern.slice(0, -1);
	} else {
		pattern += ".*";
	}
	const glob = pattern.replaceAll(".*", "*").replaceAll("\\.", ".");
	if (/[\\+?()[\]{}|^$]/.test(glob)) {
		// unsupported regex syntax — skip this target rather than risk a wrong match
		return false;
	}
	return globMatch(glob, moduleName);
}

/**
 * Determines if a tensor is quantized based on quantization config and tensor name.
 *
 * Python's transformers uses plain substring matching for `modules_to_not_convert`,
 * so bare names like `"lm_head"` must match `"model.lm_head.weight"`. When the
 * pattern contains a `*` we fall back to proper glob matching for flexibility.
 */
export function isQuantizedTensor(tensorName: string, quantConfig?: QuantizationConfig): boolean {
	if (!quantConfig) {
		return false;
	}
	// compressed-tensors spells the same concept `ignore`, with `re:`-prefixed targets
	if (quantConfig.ignore?.length) {
		const suffixIndex = tensorName.lastIndexOf(".weight");
		const moduleName = suffixIndex === -1 ? tensorName : tensorName.slice(0, suffixIndex);
		if (quantConfig.ignore.some((target) => matchesCompressedTensorsTarget(target, moduleName))) {
			return false;
		}
	}
	const patterns = quantConfig.modules_to_not_convert;
	if (!patterns?.length) {
		return true;
	}
	return !patterns.some((pattern) =>
		pattern.includes("*") ? globMatch(pattern, tensorName) : tensorName.includes(pattern),
	);
}

/**
 * @internal
 * Gets the parameter multiplier for a quantized tensor based on quantization method.
 *
 * May be fractional — see `packingFactor`.
 */
export function getQuantizationMultiplier(
	tensorName: string,
	dtype: Dtype,
	quantConfig?: QuantizationConfig,
	expertDtype?: string,
): number {
	if (!quantConfig || !isQuantizedTensor(tensorName, quantConfig)) {
		return 1;
	}

	const quantMethod = quantConfig.quant_method?.toLowerCase();

	switch (quantMethod) {
		case "mxfp4":
			if (dtype === "U8" && tensorName.includes("_blocks")) {
				return 2;
			}
			return 1;

		case "gptq":
		case "awq":
			if (getTensorSuffix(tensorName) === GPTQ_QWEIGHT_SUFFIX) {
				const bits = quantConfig.bits && quantConfig.bits > 0 ? quantConfig.bits : 4;
				return Math.max(1, Math.floor(32 / bits));
			}
			if (quantConfig.bits === 4 && dtype === "U8") {
				return 2;
			}
			if (quantConfig.bits === 2 && dtype === "U8") {
				return 4;
			}
			return 1;

		case "compressed-tensors": {
			// Any integer dtype can be the container, not just I32: MXFP4-style formats pack
			// 4-bit weights two-per-byte into U8/I8.
			if (!INTEGER_CONTAINER_BITS[dtype]) {
				return 1;
			}
			const groups = Object.values(quantConfig.config_groups ?? {});
			// Mixed-precision models pack different modules at different bit widths
			// (one config group per width), so resolve the group whose targets
			// match this tensor's module name (e.g. "model.lm_head.weight_packed"
			// -> "model.lm_head") instead of assuming a single global num_bits.
			const suffixIndex = tensorName.lastIndexOf(".weight");
			const moduleName = suffixIndex === -1 ? tensorName : tensorName.slice(0, suffixIndex);
			const group = groups.find((g) => g.targets?.some((target) => matchesCompressedTensorsTarget(target, moduleName)));
			// `format` is a family, not a constant: "pack-quantized" but also
			// "mxfp4-pack-quantized", "nvfp4-pack-quantized"... so match the suffix rather
			// than comparing for equality, which silently skipped every prefixed variant.
			const format = (group?.format ?? quantConfig.format)?.toLowerCase();
			if (!format?.endsWith("pack-quantized")) {
				return 1;
			}
			const numBits =
				group?.weights?.num_bits ??
				groups.find((g) => g.weights?.num_bits)?.weights?.num_bits ??
				// the format string itself carries the width when num_bits is absent
				bitsFromFormatString(format) ??
				4;
			return packingFactor(dtype, numBits);
		}

		case "fp8":
			// fp8 weights live in F8_* dtypes at one value per byte, so nothing to do for them.
			// But some fp8 MoEs keep their *experts* narrower still and declare it out-of-band in
			// `expert_dtype` (DeepSeek-V4-Pro: "fp4"), storing them packed in an I8 container.
			// Those experts dominate the parameter count, so missing this halves the total.
			//
			// `expert_dtype` describes the experts and nothing else, so it must not be applied to
			// every integer tensor in the model: a routing table or other integer bookkeeping would
			// otherwise be inflated by the packing factor — 8x for an I32 one.
			if (!isRoutedExpertTensor(tensorName)) {
				return 1;
			}
			return packingFactor(dtype, bitsFromFormatString(expertDtype));

		case "bitsandbytes":
			if (quantConfig.load_in_4bit && dtype === "U8") {
				return 2;
			}
			return 1;

		default:
			if (dtype === "U8" && (quantConfig.load_in_4bit || quantConfig.bits === 4)) {
				return 2;
			}
			return 1;
	}
}

export function computeTensorParameterCount(
	tensorName: string,
	info: TensorInfo,
	quantConfig?: QuantizationConfig,
	expertDtype?: string,
): number {
	if (shouldSkipTensor(tensorName, info.dtype, quantConfig) || info.shape.length === 0) {
		return 0;
	}
	const elements = info.shape.reduce((a, b) => a * b, 1);
	if (!Number.isFinite(elements)) {
		return 0;
	}
	const multiplier = getQuantizationMultiplier(tensorName, info.dtype, quantConfig, expertDtype);
	if (multiplier === 0) {
		return 0;
	}
	// Rounded because the packing factor is a ratio, not necessarily a whole number (see
	// `packingFactor`); a parameter count is always an integer.
	return Math.round(elements * multiplier);
}

/**
 * @internal
 * Sums parameters per dtype for one file's header, applying the quantization packing factors and
 * skipping bookkeeping tensors.
 */
export function computeNumOfParamsByDtypeSingleFile(
	header: SafetensorsFileHeader,
	quantConfig?: QuantizationConfig,
	expertDtype?: string,
): Partial<Record<Dtype, number>> {
	const counter: Partial<Record<Dtype, number>> = {};
	const tensors = omit(header, "__metadata__");

	for (const [tensorName, value] of typedEntries(tensors)) {
		const parameterCount = computeTensorParameterCount(tensorName, value, quantConfig, expertDtype);
		if (parameterCount === 0) {
			continue;
		}
		counter[value.dtype] = (counter[value.dtype] ?? 0) + parameterCount;
	}
	return counter;
}

export function computeNumOfParamsByDtypeSharded(
	shardedMap: SafetensorsShardedHeaders,
	quantConfig?: QuantizationConfig,
	expertDtype?: string,
): Partial<Record<Dtype, number>> {
	const counter: Partial<Record<Dtype, number>> = {};
	for (const header of Object.values(shardedMap)) {
		for (const [dtype, count] of typedEntries(computeNumOfParamsByDtypeSingleFile(header, quantConfig, expertDtype))) {
			counter[dtype] = (counter[dtype] ?? 0) + (count ?? 0);
		}
	}
	return counter;
}

function getTensorSuffix(tensorName: string): string {
	const lastDotIndex = tensorName.lastIndexOf(".");
	return lastDotIndex === -1 ? tensorName : tensorName.slice(lastDotIndex + 1);
}

function shouldSkipTensor(tensorName: string, dtype: Dtype, quantConfig?: QuantizationConfig): boolean {
	// Exponent-only dtypes only ever hold MX block scales, so they're never parameters — true even
	// with no quantization_config at all, since a model can ship scales without declaring a config.
	if (SCALE_ONLY_DTYPES.has(dtype)) {
		return true;
	}
	if (!quantConfig) {
		return false;
	}
	// Scales / zero-points accompanying quantized weights are bookkeeping, not parameters.
	if (QUANTIZATION_AUXILIARY_SUFFIXES.includes(getTensorSuffix(tensorName))) {
		return true;
	}
	const quantMethod = quantConfig.quant_method?.toLowerCase();

	// gpt-oss-style mxfp4 keeps the UE8M0 block exponents in `..._scales` next to `..._blocks`.
	// Gated on the U8 container the scales actually use, so a learnable `*_scales` parameter in some
	// other architecture is left alone.
	if (quantMethod === "mxfp4") {
		return dtype === "U8" && getTensorSuffix(tensorName).endsWith(MXFP4_SCALES_SUFFIX);
	}

	if (quantMethod === "bitsandbytes") {
		const bnbSuffix = getTensorSuffix(tensorName);
		return BITSANDBYTES_AUXILIARY_SUFFIXES.includes(bnbSuffix) || bnbSuffix.startsWith(BITSANDBYTES_QUANT_STATE_PREFIX);
	}

	if (quantMethod !== "gptq" && quantMethod !== "awq") {
		return false;
	}
	if (!isQuantizedTensor(tensorName, quantConfig)) {
		return false;
	}
	const suffix = getTensorSuffix(tensorName);
	return suffix !== GPTQ_QWEIGHT_SUFFIX && GPTQ_AWQ_AUXILIARY_SUFFIXES.includes(suffix);
}
