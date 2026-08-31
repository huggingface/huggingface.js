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
import { computeMoeInfoFromHeaders } from "./safetensors-moe-analysis";
import {
	computeNumOfParamsByDtypeSharded,
	computeNumOfParamsByDtypeSingleFile,
} from "./safetensors-parameter-analysis";
import type {
	Dtype,
	ModelConfig,
	MoeInfo,
	SafetensorsFileHeader,
	SafetensorsIndexJson,
	SafetensorsShardedHeaders,
	TensorInfo,
} from "./safetensors-analysis-types";

export {
	computeNumOfParamsByDtypeSingleFile,
	getQuantizationMultiplier,
	globMatch,
	isQuantizedTensor,
	matchesCompressedTensorsTarget,
} from "./safetensors-parameter-analysis";
export type {
	Dtype,
	ModelConfig,
	MoeInfo,
	QuantizationConfig,
	SafetensorsFileHeader,
	SafetensorsIndexJson,
	SafetensorsShardedHeaders,
	TensorInfo,
	TensorName,
} from "./safetensors-analysis-types";

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
						// A directly requested shard contains only part of the model, so a model-level
						// active-parameter breakdown cannot be inferred from it safely.
						moe:
							params.path && parseSafetensorsShardFilename(location.path.split("/").at(-1) ?? "")
								? undefined
								: computeMoeInfoFromHeaders([header], modelConfig),
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
