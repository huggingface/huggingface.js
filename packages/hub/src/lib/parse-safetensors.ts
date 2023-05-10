import type { Credentials, RepoDesignation } from "../types/public";
import { checkCredentials } from "../utils/checkCredentials";
import { omit } from "../utils/omit";
import { toRepoId } from "../utils/toRepoId";
import { typedEntries } from "../utils/typedEntries";
import { downloadFile } from "./download-file";
import { fileExists } from "./file-exists";

const SINGLE_FILE = "model.safetensors";
const INDEX_FILE = "model.safetensors.index.json";

type FileName = string;

type TensorName = string;
type Dtype = "F64" | "F32" | "F16" | "BF16" | "I64" | "I32" | "I16" | "I8" | "U8" | "BOOL";

interface TensorInfo {
	dtype: Dtype;
	shape: number[];
	data_offsets: [number, number];
}

type SafetensorsFileHeader = Record<TensorName, TensorInfo> & {
	__metadata__: Record<string, string>;
};

interface SafetensorsIndexJson {
	dtype?: string;
	/// ^there's sometimes a dtype but it looks inconsistent.
	metadata?: Record<string, string>;
	/// ^ why the naming inconsistency?
	weight_map: Record<TensorName, FileName>;
}

type SafetensorsShardedHeaders = Record<FileName, SafetensorsFileHeader>;

type SafetensorsParseFromRepo =
	| {
			sharded: false;
			header: SafetensorsFileHeader;
	  }
	| {
			sharded: true;
			index: SafetensorsIndexJson;
			headers: SafetensorsShardedHeaders;
	  };

async function parseSingleFile(
	path: string,
	params: {
		repo: RepoDesignation;
		revision?: string;
		credentials?: Credentials;
		hubUrl?: string;
	}
): Promise<SafetensorsFileHeader> {
	const firstResp = await downloadFile({
		...params,
		path,
		range: [0, 7],
	});

	if (!firstResp) {
		throw new Error("Failed to download file: " + path);
	}

	const bufLengthOfHeaderLE = await firstResp.arrayBuffer();
	const lengthOfHeader = new DataView(bufLengthOfHeaderLE).getBigUint64(0, true);
	// ^little-endian

	const secondResp = await downloadFile({ ...params, path, range: [8, 7 + Number(lengthOfHeader)] });

	if (!secondResp) {
		throw new Error("Failed to download file: " + path);
	}

	const header: SafetensorsFileHeader = await secondResp.json();

	// no validation for now, we assume it's a valid FileHeader.
	return header;
}

async function parseShardedIndex(
	path: string,
	params: {
		repo: RepoDesignation;
		revision?: string;
		credentials?: Credentials;
		hubUrl?: string;
	}
): Promise<{ index: SafetensorsIndexJson; headers: SafetensorsShardedHeaders }> {
	const indexResp = await downloadFile({
		...params,
		path,
	});

	if (!indexResp) {
		throw new Error("Failed to download file: " + path);
	}

	const index: SafetensorsIndexJson = await indexResp.json();
	/// no validation for now, we assume it's a valid IndexJson.

	const shardedMap: SafetensorsShardedHeaders = {};
	const filenames = [...new Set(Object.values(index.weight_map))];
	await Promise.all(
		filenames.map(async (filename) => {
			shardedMap[filename] = await parseSingleFile(filename, params);
			/// Note(insertion order is not deterministic)
		})
	);
	return { index, headers: shardedMap };
}

/**
 * Analyze model.safetensors.index.json or model.safetensors from a model hosted
 * on Hugging Face using smart range requests to extract its metadata.
 */
export async function parseSafetensorsMetadata(params: {
	/** Only models are supported */
	repo: RepoDesignation;
	hubUrl?: string;
	credentials?: Credentials;
	revision?: string;
}): Promise<SafetensorsParseFromRepo> {
	checkCredentials(params.credentials);
	const repoId = toRepoId(params.repo);

	if (repoId.type !== "model") {
		throw new TypeError("Only model repos should contain safetensors files.");
	}

	if (await fileExists({ ...params, path: SINGLE_FILE })) {
		return {
			sharded: false,
			header: await parseSingleFile(SINGLE_FILE, params),
		};
	} else if (await fileExists({ ...params, path: INDEX_FILE })) {
		return {
			sharded: true,
			...(await parseShardedIndex(INDEX_FILE, params)),
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

export function computeNumOfParamsByDtype(parse: SafetensorsParseFromRepo): Partial<Record<Dtype, number>> {
	if (parse.sharded) {
		return computeNumOfParamsByDtypeSharded(parse.headers);
	} else {
		return computeNumOfParamsByDtypeSingleFile(parse.header);
	}
}
