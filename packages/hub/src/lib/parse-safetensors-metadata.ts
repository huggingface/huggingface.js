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
	/^(?<prefix>(?<basePrefix>.*?)[_-])(?<shard>\d{5})-of-(?<total>\d{5})\.safetensors$/;
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
const MAX_HEADER_LENGTH = 25_000_000;

class SafetensorParseError extends Error {}

type FileName = string;

export type TensorName = string;
export type Dtype =
	| "F64"
	| "F32"
	| "F16"
	| "F8_E4M3"
	| "F8_E5M2"
	| "BF16"
	| "I64"
	| "I32"
	| "I16"
	| "I8"
	| "U16"
	| "U8"
	| "BOOL";

export interface TensorInfo {
	dtype: Dtype;
	shape: number[];
	data_offsets: [number, number];
}

export type SafetensorsFileHeader = Record<TensorName, TensorInfo> & {
	__metadata__: { total_parameters?: string | number } & Record<string, string>;
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
	  }
	| {
			sharded: true;
			index: SafetensorsIndexJson;
			headers: SafetensorsShardedHeaders;
			parameterCount?: Partial<Record<Dtype, number>>;
			parameterTotal?: number;
	  };

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
	} & Partial<CredentialsParams>
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
			`Failed to parse file ${path}: safetensor header is too big. Maximum supported size is ${MAX_HEADER_LENGTH} bytes.`
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
	} & Partial<CredentialsParams>
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
		const index = JSON.parse(await indexBlob.slice(0, 10_000_000).text());
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
	} & Partial<CredentialsParams>
): Promise<SafetensorsShardedHeaders> {
	const pathPrefix = path.slice(0, path.lastIndexOf("/") + 1);
	const filenames = [...new Set(Object.values(index.weight_map))];
	const shardedMap: SafetensorsShardedHeaders = Object.fromEntries(
		await promisesQueue(
			filenames.map(
				(filename) => async () =>
					[filename, await parseSingleFile(pathPrefix + filename, params)] satisfies [string, SafetensorsFileHeader]
			),
			PARALLEL_DOWNLOADS
		)
	);
	return shardedMap;
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
	} & Partial<CredentialsParams>
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
	} & Partial<CredentialsParams>
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
	} & Partial<CredentialsParams>
): Promise<SafetensorsParseFromRepo> {
	const repoId = toRepoId(params.repo);

	if (repoId.type !== "model") {
		throw new TypeError("Only model repos should contain safetensors files.");
	}

	if (
		(params.path && RE_SAFETENSORS_FILE.test(params.path)) ||
		(await fileExists({ ...params, path: SAFETENSORS_FILE }))
	) {
		const header = await parseSingleFile(params.path ?? SAFETENSORS_FILE, params);
		return {
			sharded: false,
			header,
			...(params.computeParametersCount
				? {
						parameterCount: computeNumOfParamsByDtypeSingleFile(header),
						parameterTotal:
							/// shortcut: get param count directly from metadata
							header.__metadata__.total_parameters
								? typeof header.__metadata__.total_parameters === "number"
									? header.__metadata__.total_parameters
									: typeof header.__metadata__.total_parameters === "string"
									  ? parseInt(header.__metadata__.total_parameters)
									  : undefined
								: undefined,
				  }
				: undefined),
		};
	} else if (
		(params.path && RE_SAFETENSORS_INDEX_FILE.test(params.path)) ||
		(await fileExists({ ...params, path: SAFETENSORS_INDEX_FILE }))
	) {
		const path = params.path ?? SAFETENSORS_INDEX_FILE;
		const index = await parseShardedIndex(path, params);
		const shardedMap = await fetchAllHeaders(path, index, params);

		return {
			sharded: true,
			index,
			headers: shardedMap,
			...(params.computeParametersCount
				? {
						parameterCount: computeNumOfParamsByDtypeSharded(shardedMap),
						parameterTotal:
							/// shortcut: get param count directly from metadata
							index.metadata?.total_parameters
								? typeof index.metadata.total_parameters === "number"
									? index.metadata.total_parameters
									: typeof index.metadata.total_parameters === "string"
									  ? parseInt(index.metadata.total_parameters)
									  : undefined
								: undefined,
				  }
				: undefined),
		};
	} else {
		throw new Error("model id does not seem to contain safetensors weights");
	}
}

function computeNumOfParamsByDtypeSingleFile(header: SafetensorsFileHeader): Partial<Record<Dtype, number>> {
	const counter: Partial<Record<Dtype, number>> = {};
	const tensors = omit(header, "__metadata__");

	for (const [, v] of typedEntries(tensors)) {
		if (v.shape.length === 0) {
			continue;
		}
		counter[v.dtype] = (counter[v.dtype] ?? 0) + v.shape.reduce((a, b) => a * b);
	}
	return counter;
}

function computeNumOfParamsByDtypeSharded(shardedMap: SafetensorsShardedHeaders): Partial<Record<Dtype, number>> {
	const counter: Partial<Record<Dtype, number>> = {};
	for (const header of Object.values(shardedMap)) {
		for (const [k, v] of typedEntries(computeNumOfParamsByDtypeSingleFile(header))) {
			counter[k] = (counter[k] ?? 0) + (v ?? 0);
		}
	}
	return counter;
}
