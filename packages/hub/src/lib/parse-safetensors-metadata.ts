import type { CredentialsParams, RepoDesignation } from "../types/public";
import { omit } from "../utils/omit";
import { toRepoId } from "../utils/toRepoId";
import { typedEntries } from "../utils/typedEntries";
import { downloadFile } from "./download-file";
import { fileExists } from "./file-exists";
import { promisesQueue } from "../utils/promisesQueue";
import type { SetRequired } from "../vendor/type-fest/set-required";
import { parseSafetensorsIndexStream } from "./parse-safetensors-index";
import { sum } from "../utils/sum";

export const SAFETENSORS_FILE = "model.safetensors";
export const SAFETENSORS_INDEX_FILE = "model.safetensors.index.json";
/// Safetensors filenames and weight subfolders used by the `diffusers` library
/// (see LIBRARY_WEIGHT_CANDIDATES below).
export const DIFFUSERS_SAFETENSORS_FILE = "diffusion_pytorch_model.safetensors";
export const DIFFUSERS_SAFETENSORS_INDEX_FILE = "diffusion_pytorch_model.safetensors.index.json";
export const DIFFUSERS_WEIGHTS_SUBFOLDERS = ["transformer", "unet"] as const;
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
// Upper bound on a single tensor dimension, mirroring the gguf package. Dims are multiplied
// together for the parameter count, and were trusted unchecked. Absurdly generous — the
// largest dimension in a real model is a vocab size, O(10^5).
const MAX_TENSOR_DIM = 2 ** 32;
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
function isRoutedExpertTensor(tensorName: string): boolean {
	return tensorName.includes(".experts.") && !tensorName.includes("shared_experts");
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
 * Thrown when a safetensors file or sharded index is malformed (bad header, invalid tensor
 * entry, unsafe shard filename, …) rather than a failure when fetching, so callers can treat
 * the failure as permanent — e.g. drop a cached parse result instead of keeping it for retry.
 */
export class SafetensorParseError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "SafetensorParseError";
	}
}

/**
 * Validates one tensor entry from a header: dims are finite integers under `MAX_TENSOR_DIM`,
 * `data_offsets` are sane, and — when the file size is known — the declared byte span fits in
 * the file. `data_offsets` is checked rather than `shape * dtype size` because the two may
 * legitimately disagree (padding), so offsets are the only ground truth the format gives us.
 */
export function validateTensorEntry(
	path: string,
	tensorName: string,
	info: TensorInfo,
	fileSizeBytes: number | undefined,
): void {
	if (!Array.isArray(info.shape) || !Array.isArray(info.data_offsets) || info.data_offsets.length !== 2) {
		throw new SafetensorParseError(`Failed to parse file ${path}: tensor "${tensorName}" is malformed.`);
	}
	for (const dim of info.shape) {
		if (!Number.isFinite(dim) || !Number.isInteger(dim) || dim < 0) {
			throw new SafetensorParseError(
				`Failed to parse file ${path}: tensor "${tensorName}" has an invalid dimension (${dim}).`,
			);
		}
		if (dim > MAX_TENSOR_DIM) {
			throw new SafetensorParseError(
				`Failed to parse file ${path}: tensor "${tensorName}" dimension is ${dim}, which exceeds the maximum allowed (${MAX_TENSOR_DIM}).`,
			);
		}
	}
	const [begin, end] = info.data_offsets;
	if (
		!Number.isFinite(begin) ||
		!Number.isFinite(end) ||
		!Number.isInteger(begin) ||
		!Number.isInteger(end) ||
		begin < 0 ||
		end < begin
	) {
		throw new SafetensorParseError(`Failed to parse file ${path}: tensor "${tensorName}" has invalid data_offsets.`);
	}
	// Skipped when the size is unknown (e.g. a custom fetch whose returned blob doesn't report
	// it) rather than blocking the parse on a guess.
	if (fileSizeBytes !== undefined && end > fileSizeBytes) {
		throw new SafetensorParseError(
			`Failed to parse file ${path}: tensor "${tensorName}" declares data_offsets ending at ${end}, ` +
				`which exceeds the file size (${fileSizeBytes} bytes). The file is malformed.`,
		);
	}
}

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
	weight_map?: Record<TensorName, FileName>;
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
): Promise<{ header: SafetensorsFileHeader; fileSizeBytes: number | undefined }> {
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

	let header: SafetensorsFileHeader;
	try {
		header = JSON.parse(await blob.slice(8, 8 + Number(lengthOfHeader)).text());
	} catch (err) {
		throw new SafetensorParseError(`Failed to parse file ${path}: safetensors header is not valid JSON.`);
	}

	// The blob's size is the file's true size (WebBlob learns it from the Content-Range probe);
	// undefined when a custom fetch doesn't report one.
	const fileSizeBytes = Number.isFinite(blob.size) && blob.size >= 0 ? blob.size : undefined;

	for (const [tensorName, info] of typedEntries(omit(header, "__metadata__"))) {
		validateTensorEntry(path, tensorName, info, fileSizeBytes);
	}

	return { header, fileSizeBytes };
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
): Promise<{ index: SafetensorsIndexJson; shardFilenames: string[] }> {
	const indexBlob = await downloadFile({
		...params,
		path,
	});

	if (!indexBlob) {
		throw new SafetensorParseError(`Failed to parse file ${path}: failed to fetch safetensors index.`);
	}

	try {
		// Parsed as a stream rather than with JSON.parse: index files for large MoEs reach tens of MB
		// (Kimi-K3: ~60MB / 497k tensors) and used to be truncated to MAX_HEADER_LENGTH and fail. We
		// only need `metadata` plus the distinct shard filenames, so memory stays proportional to the
		// shard count instead of the tensor count.
		const { dtype, metadata, shardFilenames, weightMap } = await parseSafetensorsIndexStream(indexBlob.stream(), {
			maxShardCount: MAX_SHARD_COUNT,
		});
		return {
			index: { dtype, metadata, weight_map: weightMap },
			shardFilenames,
		};
	} catch (error) {
		throw new SafetensorParseError(
			`Failed to parse file ${path}: ${error instanceof Error ? error.message : "not a valid JSON."}`,
		);
	}
}

async function fetchAllHeaders(
	path: string,
	filenames: string[],
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
		(
			await promisesQueue(
				filenames.map(
					(filename) => async () =>
						[filename, await parseSingleFile(pathPrefix + filename, params)] satisfies [
							string,
							{ header: SafetensorsFileHeader; fileSizeBytes: number | undefined },
						],
				),
				PARALLEL_DOWNLOADS,
			)
		).map(([filename, { header }]) => [filename, header]),
	);
	return shardedMap;
}

/**
 * Reads the `total_parameters` shortcut from the header/index metadata. It's self-reported and
 * the Hub displays it verbatim, bypassing the header validation above — so cap it at the
 * computed count when we have one (a no-op for well-formed files, where the two agree).
 */
export function parseTotalParameters(value: string | number | undefined, computedTotal?: number): number | undefined {
	if (!value) {
		return undefined;
	}
	const parsed = typeof value === "number" ? value : parseInt(value);
	if (!Number.isFinite(parsed) || parsed < 0) {
		return undefined;
	}
	if (computedTotal !== undefined && parsed > computedTotal) {
		return computedTotal;
	}
	return parsed;
}

interface SafetensorsLocation {
	path: string;
	sharded: boolean;
}

/// Extra weight locations to probe for specific libraries, beyond the root-level
/// model.safetensors[.index.json]. Add an entry here to support a new library's layout.
const LIBRARY_WEIGHT_CANDIDATES: Record<string, Array<{ single: string; index: string }>> = {
	// diffusers keeps the main module (the diffusion transformer / U-Net) under a subfolder,
	// or at the repo root for single-component repos (ControlNets, standalone VAEs). This matches
	// how a diffusion model's size is conventionally reported: the diffusion transformer / U-Net,
	// not the sum of VAE + text encoders.
	diffusers: [
		...DIFFUSERS_WEIGHTS_SUBFOLDERS.map((folder) => ({
			single: `${folder}/${DIFFUSERS_SAFETENSORS_FILE}`,
			index: `${folder}/${DIFFUSERS_SAFETENSORS_INDEX_FILE}`,
		})),
		{ single: DIFFUSERS_SAFETENSORS_FILE, index: DIFFUSERS_SAFETENSORS_INDEX_FILE },
	],
};

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
		/**
		 * Library hint (e.g. the repo's `library_name`) selecting where to look for weights.
		 * `"diffusers"` resolves the main module under `transformer/`/`unet/`/root; unknown or empty
		 * keeps the default root-level `model.safetensors[.index.json]`. Ignored when `path` is set.
		 *
		 * @default undefined
		 */
		library?: string;
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
		/**
		 * Library hint (e.g. the repo's `library_name`) selecting where to look for weights.
		 * `"diffusers"` resolves the main module under `transformer/`/`unet/`/root; unknown or empty
		 * keeps the default root-level `model.safetensors[.index.json]`. Ignored when `path` is set.
		 *
		 * @default undefined
		 */
		library?: string;
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
		library?: string;
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
	const expertDtype = modelConfig?.expert_dtype ?? modelConfig?.text_config?.expert_dtype;

	// Resolve which file to parse, in order:
	//  1. An explicit `params.path` (single file or sharded index, detected from the filename).
	//  2. The conventional root-level `model.safetensors` / `model.safetensors.index.json`.
	//  3. Library-specific locations selected by `params.library` (see LIBRARY_WEIGHT_CANDIDATES).
	//     Unknown or empty libraries add no extra locations.
	let location: SafetensorsLocation | undefined;
	if (params.path) {
		if (RE_SAFETENSORS_FILE.test(params.path)) {
			location = { path: params.path, sharded: false };
		} else if (RE_SAFETENSORS_INDEX_FILE.test(params.path)) {
			location = { path: params.path, sharded: true };
		}
	} else {
		const candidates: Array<{ single: string; index: string }> = [
			{ single: SAFETENSORS_FILE, index: SAFETENSORS_INDEX_FILE },
			...(params.library ? (LIBRARY_WEIGHT_CANDIDATES[params.library] ?? []) : []),
		];
		for (const { single, index } of candidates) {
			if (await fileExists({ ...params, path: single })) {
				location = { path: single, sharded: false };
				break;
			}
			if (await fileExists({ ...params, path: index })) {
				location = { path: index, sharded: true };
				break;
			}
		}
	}

	if (location && !location.sharded) {
		const { header } = await parseSingleFile(location.path, params);
		const paramStats = params.computeParametersCount
			? (() => {
					const parameterCount = computeNumOfParamsByDtypeSingleFile(header, quantConfig, expertDtype);
					return {
						parameterCount,
						/// shortcut: get param count directly from metadata
						parameterTotal: parseTotalParameters(
							header.__metadata__?.total_parameters,
							sum(Object.values(parameterCount)),
						),
						moe: computeMoeInfoFromHeaders([header], modelConfig),
					};
				})()
			: undefined;
		return {
			sharded: false,
			header,
			...paramStats,
			filepaths: [location.path],
		};
	} else if (location) {
		const path = location.path;
		const { index, shardFilenames } = await parseShardedIndex(path, params);
		const shardedMap = await fetchAllHeaders(path, shardFilenames, params);
		const pathPrefix = path.slice(0, path.lastIndexOf("/") + 1);

		const paramStats = params.computeParametersCount
			? (() => {
					const parameterCount = computeNumOfParamsByDtypeSharded(shardedMap, quantConfig, expertDtype);
					return {
						parameterCount,
						/// shortcut: get param count directly from metadata
						parameterTotal: parseTotalParameters(index.metadata?.total_parameters, sum(Object.values(parameterCount))),
						moe: computeMoeInfoFromHeaders(Object.values(shardedMap), modelConfig),
					};
				})()
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
	/**
	 * compressed-tensors names its exclusion list `ignore` rather than `modules_to_not_convert`,
	 * using the same `re:`-prefixed target syntax as `config_groups[].targets`.
	 */
	ignore?: string[];
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
	text_config?: { quantization_config?: QuantizationConfig } & MoeConfigFields & Pick<ModelConfig, "expert_dtype">;
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

		case "fp8": {
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
		}

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
	if (!config) {
		return undefined;
	}
	const sources: MoeConfigFields[] = [config, config.text_config ?? {}];
	let topK: number | undefined;
	let numExperts: number | undefined;
	for (const src of sources) {
		topK = topK ?? src.num_experts_per_tok ?? src.num_experts_per_token;
		numExperts = numExperts ?? src.num_local_experts ?? src.num_experts ?? src.n_routed_experts;
	}
	if (!topK || !numExperts || topK <= 0 || numExperts <= 0 || topK > numExperts) {
		return undefined;
	}
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
function isMoeRoutedExpertTensor(name: string, info: TensorInfo, numExperts: number): boolean {
	if (name.includes("shared_expert")) {
		return false;
	}
	if (/\.experts\.(?:expert_)?\d+\./.test(name)) {
		return true;
	}
	if (/\.experts\.[A-Za-z_][\w]*(?:\.(?:weight|bias))?$/.test(name) && info.shape[0] === numExperts) {
		return true;
	}
	return false;
}

function computeMoeInfoFromHeaders(
	headers: Iterable<SafetensorsFileHeader>,
	config: ModelConfig | null,
): MoeInfo | undefined {
	const moeCfg = getMoeConfig(config);
	if (!moeCfg) {
		return undefined;
	}

	let total = 0;
	let routedExpert = 0;
	let hasSharedExpert = false;

	for (const header of headers) {
		for (const [name, value] of Object.entries(header)) {
			if (name === "__metadata__") {
				continue;
			}
			const info = value as TensorInfo;
			if (info.shape.length === 0) {
				continue;
			}
			const n = info.shape.reduce((a, b) => a * b, 1);
			if (!Number.isFinite(n)) {
				continue;
			}
			total += n;
			if (isMoeRoutedExpertTensor(name, info, moeCfg.numExperts)) {
				routedExpert += n;
			} else if (name.includes("shared_expert")) {
				hasSharedExpert = true;
			}
		}
	}

	if (routedExpert === 0) {
		return undefined;
	} // config says MoE but tensors don't look like one — bail safely

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

	for (const [tensorName, v] of typedEntries(tensors)) {
		if (shouldSkipTensor(tensorName, v.dtype, quantConfig)) {
			continue;
		}
		if (v.shape.length === 0) {
			continue;
		}

		const elements = v.shape.reduce((a, b) => a * b);
		if (!Number.isFinite(elements)) {
			continue;
		}
		const multiplier = quantConfig ? getQuantizationMultiplier(tensorName, v.dtype, quantConfig, expertDtype) : 1;
		if (multiplier === 0) {
			continue;
		}
		// Rounded because the packing factor is a ratio, not necessarily a whole number (see
		// `packingFactor`); a parameter count is always an integer.
		counter[v.dtype] = (counter[v.dtype] ?? 0) + Math.round(elements * multiplier);
	}
	return counter;
}

function computeNumOfParamsByDtypeSharded(
	shardedMap: SafetensorsShardedHeaders,
	quantConfig?: QuantizationConfig,
	expertDtype?: string,
): Partial<Record<Dtype, number>> {
	const counter: Partial<Record<Dtype, number>> = {};
	for (const header of Object.values(shardedMap)) {
		for (const [k, v] of typedEntries(computeNumOfParamsByDtypeSingleFile(header, quantConfig, expertDtype))) {
			counter[k] = (counter[k] ?? 0) + (v ?? 0);
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
