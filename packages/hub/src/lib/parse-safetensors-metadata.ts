import type { CredentialsParams, RepoDesignation } from "../types/public";
import { omit } from "../utils/omit";
import { toRepoId } from "../utils/toRepoId";
import { typedEntries } from "../utils/typedEntries";
import { downloadFile } from "./download-file";
import { fileExists } from "./file-exists";
import { promisesQueue } from "../utils/promisesQueue";
import type { SetRequired } from "../vendor/type-fest/set-required";

export const SAFETENSORS_FILE = "model.safetensors";
export const SAFETENSORS_INDEX_FILE = "model.safetensors.index.json";
/// We advise model/library authors to use the filenames above for convention inside model repos,
/// but in some situations safetensors weights have different filenames.
export const RE_SAFETENSORS_FILE = /\.safetensors$/;
export const RE_SAFETENSORS_INDEX_FILE = /\.safetensors\.index\.json$/;
export const RE_SAFETENSORS_SHARD_FILE =
	/^(?<prefix>(?<basePrefix>.*?)[_-])(?<shard>\d{5,6})-of-(?<total>\d{5,6})\.safetensors$/;
export interface SafetensorsShardFileInfo {
	prefix: string;
	basePrefix: string;
	shard: string;
	total: string;
}
export function parseSafetensorsShardFilename(filename: string): SafetensorsShardFileInfo | null {
	const match = RE_SAFETENSORS_SHARD_FILE.exec(filename);
	if (match && match.groups) {
		return {
			prefix: match.groups["prefix"],
			basePrefix: match.groups["basePrefix"],
			shard: match.groups["shard"],
			total: match.groups["total"],
		};
	}
	return null;
}

const PARALLEL_DOWNLOADS = 20;
const MAX_HEADER_LENGTH = 25_000_000; // 25MB
const MAX_CONFIG_LENGTH = 10_000_000; // 10MB — config.json is typically small; cap to avoid large memory use
const MAX_SHARD_COUNT = 10_000; // well above any real sharded model; blocks crafted index with millions of entries
const GPTQ_QWEIGHT_SUFFIX = "qweight";
const GPTQ_AWQ_AUXILIARY_SUFFIXES = ["qzeros", "g_idx", "scales"];

class SafetensorParseError extends Error {}

type FileName = string;

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
	weight_map: Record<TensorName, FileName>;
}

export type SafetensorsShardedHeaders = Record<FileName, SafetensorsFileHeader>;

export type SafetensorsParseFromRepo =
	| {
			sharded: false;
			header: SafetensorsFileHeader;
			parameterCount?: Partial<Record<Dtype, number>>;
			parameterTotal?: number;
			/**
			 * For Mixture-of-Experts models: breakdown of routed vs. always-active params,
			 * computed when `computeParametersCount: true` and the repo's `config.json`
			 * exposes MoE fields. Undefined for dense models.
			 */
			moe?: MoeInfo;
			filepaths: string[];
	  }
	| {
			sharded: true;
			index: SafetensorsIndexJson;
			headers: SafetensorsShardedHeaders;
			parameterCount?: Partial<Record<Dtype, number>>;
			parameterTotal?: number;
			/**
			 * For Mixture-of-Experts models: breakdown of routed vs. always-active params,
			 * computed when `computeParametersCount: true` and the repo's `config.json`
			 * exposes MoE fields. Undefined for dense models.
			 */
			moe?: MoeInfo;
			filepaths: string[];
	  };

/**
 * Fetches and parses model config.json
 */
async function fetchModelConfig(
	params: {
		repo: RepoDesignation;
		revision?: string;
		hubUrl?: string;
		fetch?: typeof fetch;
	} & Partial<CredentialsParams>,
): Promise<ModelConfig | null> {
	try {
		const configBlob = await downloadFile({
			...params,
			path: "config.json",
		});

		if (!configBlob) {
			return null;
		}

		const config = JSON.parse(await configBlob.slice(0, MAX_CONFIG_LENGTH).text());
		return config as ModelConfig;
	} catch (error) {
		// Config file might not exist or be inaccessible
		return null;
	}
}

async function parseSingleFile(
	path: string,
	params: {
		repo: RepoDesignation;
		revision?: string;
		hubUrl?: string;
		/**
		 * Custom fetch function to use instead of the default one, for example to use a proxy or edit headers.
		 */
		fetch?: typeof fetch;
	} & Partial<CredentialsParams>,
): Promise<SafetensorsFileHeader> {
	const blob = await downloadFile({ ...params, path });

	if (!blob) {
		throw new SafetensorParseError(`Failed to parse file ${path}: failed to fetch safetensors header length.`);
	}

	const bufLengthOfHeaderLE = await blob.slice(0, 8).arrayBuffer();
	const lengthOfHeader = new DataView(bufLengthOfHeaderLE).getBigUint64(0, true);
	// ^little-endian
	if (lengthOfHeader <= 0) {
		throw new SafetensorParseError(`Failed to parse file ${path}: safetensors header is malformed.`);
	}
	if (lengthOfHeader > MAX_HEADER_LENGTH) {
		throw new SafetensorParseError(
			`Failed to parse file ${path}: safetensor header is too big. Maximum supported size is ${MAX_HEADER_LENGTH} bytes.`,
		);
	}

	try {
		// no validation for now, we assume it's a valid FileHeader.
		const header: SafetensorsFileHeader = JSON.parse(await blob.slice(8, 8 + Number(lengthOfHeader)).text());
		return header;
	} catch (err) {
		throw new SafetensorParseError(`Failed to parse file ${path}: safetensors header is not valid JSON.`);
	}
}

async function parseShardedIndex(
	path: string,
	params: {
		repo: RepoDesignation;
		revision?: string;
		hubUrl?: string;
		/**
		 * Custom fetch function to use instead of the default one, for example to use a proxy or edit headers.
		 */
		fetch?: typeof fetch;
	} & Partial<CredentialsParams>,
): Promise<SafetensorsIndexJson> {
	const indexBlob = await downloadFile({
		...params,
		path,
	});

	if (!indexBlob) {
		throw new SafetensorParseError(`Failed to parse file ${path}: failed to fetch safetensors index.`);
	}

	try {
		// no validation for now, we assume it's a valid IndexJson.
		const index = JSON.parse(await indexBlob.slice(0, MAX_HEADER_LENGTH).text());
		return index;
	} catch (error) {
		throw new SafetensorParseError(`Failed to parse file ${path}: not a valid JSON.`);
	}
}

async function fetchAllHeaders(
	path: string,
	index: SafetensorsIndexJson,
	params: {
		repo: RepoDesignation;
		revision?: string;
		hubUrl?: string;
		/**
		 * Custom fetch function to use instead of the default one, for example to use a proxy or edit headers.
		 */
		fetch?: typeof fetch;
	} & Partial<CredentialsParams>,
): Promise<SafetensorsShardedHeaders> {
	const pathPrefix = path.slice(0, path.lastIndexOf("/") + 1);
	const filenames = [...new Set(Object.values(index.weight_map))];
	if (filenames.length > MAX_SHARD_COUNT) {
		throw new SafetensorParseError(
			`Too many shard files (${filenames.length}). Maximum supported is ${MAX_SHARD_COUNT}.`,
		);
	}
	for (const filename of filenames) {
		if (filename.includes("..") || filename.startsWith("/") || filename.includes("://")) {
			throw new SafetensorParseError(`Unsafe shard filename in weight_map: "${filename}"`);
		}
	}
	const shardedMap: SafetensorsShardedHeaders = Object.fromEntries(
		await promisesQueue(
			filenames.map(
				(filename) => async () =>
					[filename, await parseSingleFile(pathPrefix + filename, params)] satisfies [string, SafetensorsFileHeader],
			),
			PARALLEL_DOWNLOADS,
		),
	);
	return shardedMap;
}

function parseTotalParameters(value: string | number | undefined): number | undefined {
	if (!value) {
		return undefined;
	}
	if (typeof value === "number") {
		return value;
	}
	return parseInt(value);
}

/**
 * Analyze model.safetensors.index.json or model.safetensors from a model hosted
 * on Hugging Face using smart range requests to extract its metadata.
 */
export async function parseSafetensorsMetadata(
	params: {
		/** Only models are supported */
		repo: RepoDesignation;
		/**
		 * Relative file path to safetensors file inside `repo`. Defaults to `SAFETENSORS_FILE` or `SAFETENSORS_INDEX_FILE` (whichever one exists).
		 */
		path?: string;
		/**
		 * Will include SafetensorsParseFromRepo["parameterCount"], an object containing the number of parameters for each DType
		 *
		 * @default false
		 */
		computeParametersCount: true;
		hubUrl?: string;
		revision?: string;
		/**
		 * Custom fetch function to use instead of the default one, for example to use a proxy or edit headers.
		 */
		fetch?: typeof fetch;
	} & Partial<CredentialsParams>,
): Promise<SetRequired<SafetensorsParseFromRepo, "parameterCount">>;
export async function parseSafetensorsMetadata(
	params: {
		/** Only models are supported */
		repo: RepoDesignation;
		path?: string;
		/**
		 * Will include SafetensorsParseFromRepo["parameterCount"], an object containing the number of parameters for each DType
		 *
		 * @default false
		 */
		computeParametersCount?: boolean;
		hubUrl?: string;
		revision?: string;
		/**
		 * Custom fetch function to use instead of the default one, for example to use a proxy or edit headers.
		 */
		fetch?: typeof fetch;
	} & Partial<CredentialsParams>,
): Promise<SafetensorsParseFromRepo>;
export async function parseSafetensorsMetadata(
	params: {
		repo: RepoDesignation;
		path?: string;
		computeParametersCount?: boolean;
		hubUrl?: string;
		revision?: string;
		/**
		 * Custom fetch function to use instead of the default one, for example to use a proxy or edit headers.
		 */
		fetch?: typeof fetch;
	} & Partial<CredentialsParams>,
): Promise<SafetensorsParseFromRepo> {
	const repoId = toRepoId(params.repo);

	if (repoId.type !== "model") {
		throw new TypeError("Only model repos should contain safetensors files.");
	}

	// Fetch model config for quantization information
	const modelConfig = params.computeParametersCount ? await fetchModelConfig(params) : null;
	const quantConfig = modelConfig?.quantization_config ?? modelConfig?.text_config?.quantization_config;

	if (
		(params.path && RE_SAFETENSORS_FILE.test(params.path)) ||
		(await fileExists({ ...params, path: SAFETENSORS_FILE }))
	) {
		const header = await parseSingleFile(params.path ?? SAFETENSORS_FILE, params);
		const paramStats = params.computeParametersCount
			? {
					parameterCount: computeNumOfParamsByDtypeSingleFile(header, quantConfig),
					/// shortcut: get param count directly from metadata
					parameterTotal: parseTotalParameters(header.__metadata__?.total_parameters),
					moe: computeMoeInfoFromHeaders([header], modelConfig),
				}
			: undefined;
		return {
			sharded: false,
			header,
			...paramStats,
			filepaths: [params.path ?? SAFETENSORS_FILE],
		};
	} else if (
		(params.path && RE_SAFETENSORS_INDEX_FILE.test(params.path)) ||
		(await fileExists({ ...params, path: SAFETENSORS_INDEX_FILE }))
	) {
		const path = params.path ?? SAFETENSORS_INDEX_FILE;
		const index = await parseShardedIndex(path, params);
		const shardedMap = await fetchAllHeaders(path, index, params);
		const pathPrefix = path.slice(0, path.lastIndexOf("/") + 1);

		const paramStats = params.computeParametersCount
			? {
					parameterCount: computeNumOfParamsByDtypeSharded(shardedMap, quantConfig),
					/// shortcut: get param count directly from metadata
					parameterTotal: parseTotalParameters(index.metadata?.total_parameters),
					moe: computeMoeInfoFromHeaders(Object.values(shardedMap), modelConfig),
				}
			: undefined;
		return {
			sharded: true,
			index,
			headers: shardedMap,
			...paramStats,
			filepaths: [path, ...Object.keys(shardedMap).map((filename) => pathPrefix + filename)],
		};
	} else {
		throw new Error("model id does not seem to contain safetensors weights");
	}
}

export interface QuantizationConfig {
	quant_method?: string;
	modules_to_not_convert?: string[];
	bits?: number;
	load_in_4bit?: boolean;
	load_in_8bit?: boolean;
	// compressed-tensors specific
	format?: string;
	config_groups?: Record<string, { format?: string; targets?: string[]; weights?: { num_bits?: number } }>;
}

interface MoeConfigFields {
	/** Common across Mixtral, Qwen2/3-MoE, Llama4, GPT-OSS, … */
	num_experts_per_tok?: number;
	/** Alternative spelling (some checkpoints) */
	num_experts_per_token?: number;
	num_local_experts?: number;
	num_experts?: number;
	/** DeepSeek family */
	n_routed_experts?: number;
	n_shared_experts?: number;
	/** Multi-modal Ernie 4.5 */
	moe_num_shared_experts?: number;
}

export interface ModelConfig extends MoeConfigFields {
	quantization_config?: QuantizationConfig;
	text_config?: { quantization_config?: QuantizationConfig } & MoeConfigFields;
}

/**
 * Active-parameter breakdown for Mixture-of-Experts models.
 *
 * For MoE models, only `topK` of `numExperts` routed experts run per token, so the
 * usable ("active") parameter count is much smaller than the total stored on disk.
 * `active = alwaysActive + topK * perExpert`. Returned by `parseSafetensorsMetadata`
 * when the model's `config.json` exposes MoE fields and tensor names indicate a
 * supported expert layout.
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
	/** True when the model has a dense shared-expert MLP alongside routed experts (Deepseek, Qwen-MoE, Command-A, …). */
	hasSharedExpert: boolean;
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
 * Gets the parameter multiplier for a quantized tensor based on quantization method
 */
function getQuantizationMultiplier(tensorName: string, dtype: Dtype, quantConfig?: QuantizationConfig): number {
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

		case "compressed-tensors":
			if (dtype === "I32") {
				const groups = Object.values(quantConfig.config_groups ?? {});
				// Mixed-precision models pack different modules at different bit widths
				// (one config group per width), so resolve the group whose targets
				// match this tensor's module name (e.g. "model.lm_head.weight_packed"
				// -> "model.lm_head") instead of assuming a single global num_bits.
				const suffixIndex = tensorName.lastIndexOf(".weight");
				const moduleName = suffixIndex === -1 ? tensorName : tensorName.slice(0, suffixIndex);
				const group = groups.find((g) =>
					g.targets?.some((target) => matchesCompressedTensorsTarget(target, moduleName)),
				);
				if (group) {
					if ((group.format ?? quantConfig.format) !== "pack-quantized") {
						return 1;
					}
					const numBits = group.weights?.num_bits ?? 4;
					return Math.max(1, Math.floor(32 / numBits));
				}
				// fallback when no group targets match: first group's num_bits
				if (quantConfig.format === "pack-quantized") {
					const numBits = groups.find((g) => g.weights?.num_bits)?.weights?.num_bits ?? 4;
					return Math.max(1, Math.floor(32 / numBits));
				}
			}
			return 1;

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

function getMoeConfig(config: ModelConfig | null): Pick<MoeInfo, "topK" | "numExperts"> | undefined {
	if (!config) return undefined;
	const sources: MoeConfigFields[] = [config, config.text_config ?? {}];
	let topK: number | undefined;
	let numExperts: number | undefined;
	for (const src of sources) {
		topK = topK ?? src.num_experts_per_tok ?? src.num_experts_per_token;
		numExperts = numExperts ?? src.num_local_experts ?? src.num_experts ?? src.n_routed_experts;
	}
	if (!topK || !numExperts || topK <= 0 || numExperts <= 0 || topK > numExperts) return undefined;
	return { topK, numExperts };
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
function isRoutedExpertTensor(name: string, info: TensorInfo, numExperts: number): boolean {
	if (name.includes("shared_expert")) return false;
	if (/\.experts\.(?:expert_)?\d+\./.test(name)) return true;
	if (/\.experts\.[A-Za-z_][\w]*(?:\.(?:weight|bias))?$/.test(name) && info.shape[0] === numExperts) return true;
	return false;
}

function computeMoeInfoFromHeaders(
	headers: Iterable<SafetensorsFileHeader>,
	config: ModelConfig | null,
): MoeInfo | undefined {
	const moeCfg = getMoeConfig(config);
	if (!moeCfg) return undefined;

	let total = 0;
	let routedExpert = 0;
	let hasSharedExpert = false;

	for (const header of headers) {
		for (const [name, value] of Object.entries(header)) {
			if (name === "__metadata__") continue;
			const info = value as TensorInfo;
			if (info.shape.length === 0) continue;
			const n = info.shape.reduce((a, b) => a * b, 1);
			if (!Number.isFinite(n)) continue;
			total += n;
			if (isRoutedExpertTensor(name, info, moeCfg.numExperts)) routedExpert += n;
			else if (name.includes("shared_expert")) hasSharedExpert = true;
		}
	}

	if (routedExpert === 0) return undefined; // config says MoE but tensors don't look like one — bail safely

	const perExpert = routedExpert / moeCfg.numExperts;
	const alwaysActive = total - routedExpert;
	const active = alwaysActive + moeCfg.topK * perExpert;

	return {
		numExperts: moeCfg.numExperts,
		topK: moeCfg.topK,
		perExpert,
		alwaysActive,
		active,
		hasSharedExpert,
	};
}

function computeNumOfParamsByDtypeSingleFile(
	header: SafetensorsFileHeader,
	quantConfig?: QuantizationConfig,
): Partial<Record<Dtype, number>> {
	const counter: Partial<Record<Dtype, number>> = {};
	const tensors = omit(header, "__metadata__");

	for (const [tensorName, v] of typedEntries(tensors)) {
		if (shouldSkipTensor(tensorName, quantConfig)) {
			continue;
		}
		if (v.shape.length === 0) {
			continue;
		}

		const elements = v.shape.reduce((a, b) => a * b);
		if (!Number.isFinite(elements)) {
			continue;
		}
		const multiplier = quantConfig ? getQuantizationMultiplier(tensorName, v.dtype, quantConfig) : 1;
		if (multiplier === 0) {
			continue;
		}
		counter[v.dtype] = (counter[v.dtype] ?? 0) + elements * multiplier;
	}
	return counter;
}

function computeNumOfParamsByDtypeSharded(
	shardedMap: SafetensorsShardedHeaders,
	quantConfig?: QuantizationConfig,
): Partial<Record<Dtype, number>> {
	const counter: Partial<Record<Dtype, number>> = {};
	for (const header of Object.values(shardedMap)) {
		for (const [k, v] of typedEntries(computeNumOfParamsByDtypeSingleFile(header, quantConfig))) {
			counter[k] = (counter[k] ?? 0) + (v ?? 0);
		}
	}
	return counter;
}

function getTensorSuffix(tensorName: string): string {
	const lastDotIndex = tensorName.lastIndexOf(".");
	return lastDotIndex === -1 ? tensorName : tensorName.slice(lastDotIndex + 1);
}

function shouldSkipTensor(tensorName: string, quantConfig?: QuantizationConfig): boolean {
	if (!quantConfig) {
		return false;
	}
	const quantMethod = quantConfig.quant_method?.toLowerCase();
	if (quantMethod !== "gptq" && quantMethod !== "awq") {
		return false;
	}
	if (!isQuantizedTensor(tensorName, quantConfig)) {
		return false;
	}
	const suffix = getTensorSuffix(tensorName);
	return suffix !== GPTQ_QWEIGHT_SUFFIX && GPTQ_AWQ_AUXILIARY_SUFFIXES.includes(suffix);
}
