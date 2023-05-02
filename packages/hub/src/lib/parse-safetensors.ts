import { HUB_URL } from "../consts";
import type { Credentials, RepoDesignation } from "../types/public";
import { Counter } from "../utils/Counter";
import { checkCredentials } from "../utils/checkCredentials";
import { omit } from "../utils/pick";
import { toRepoId } from "../utils/toRepoId";
import { typedEntries } from "../utils/typedEntries";

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

type FileHeader = Record<TensorName, TensorInfo> & {
	__metadata__: Record<string, string>;
};

interface IndexJson {
	dtype?: string;
	/// ^there's sometimes a dtype but it looks inconsistent.
	metadata?: Record<string, string>;
	/// ^ why the naming inconsistency?
	weight_map: Record<TensorName, FileName>;
}

type ShardedHeaders = Record<FileName, FileHeader>;

type ParseFromRepo =
	| {
			sharded: false;
			header: FileHeader;
	  }
	| {
			sharded: true;
			index: IndexJson;
			headers: ShardedHeaders;
	  };

async function parseSingleFile(
	url: URL,
	params: {
		credentials?: Credentials;
	} = {}
): Promise<FileHeader> {
	const bufLengthOfHeaderLE = await (
		await fetch(url, {
			headers: {
				Range: "bytes=0-7",
				...(params.credentials
					? {
							Authorization: `Bearer ${params.credentials.accessToken}`,
					  }
					: {}),
			},
		})
	).arrayBuffer();
	const lengthOfHeader = new DataView(bufLengthOfHeaderLE).getBigUint64(0, true);
	/// ^little-endian
	const header: FileHeader = await (
		await fetch(url, {
			headers: {
				Range: `bytes=8-${7 + Number(lengthOfHeader)}`,
				...(params.credentials
					? {
							Authorization: `Bearer ${params.credentials.accessToken}`,
					  }
					: {}),
			},
		})
	).json();
	/// no validation for now, we assume it's a valid FileHeader.
	return header;
}

async function parseShardedIndex(
	url: URL,
	params: {
		credentials?: Credentials;
	} = {}
): Promise<{ index: IndexJson; headers: ShardedHeaders }> {
	const index: IndexJson = await (
		await fetch(url, {
			headers: params.credentials
				? {
						Authorization: `Bearer ${params.credentials.accessToken}`,
				  }
				: {},
		})
	).json();
	/// no validation for now, we assume it's a valid IndexJson.

	const shardedMap: ShardedHeaders = {};
	const filenames = [...new Set(Object.values(index.weight_map))];
	await Promise.all(
		filenames.map(async (filename) => {
			const singleUrl = new URL(url.toString().replace(INDEX_FILE, filename));
			shardedMap[filename] = await parseSingleFile(singleUrl, params);
		})
	);
	return { index, headers: shardedMap };
}

async function doesFileExistOnHub(
	url: URL,
	params: {
		credentials?: Credentials;
	} = {}
): Promise<boolean> {
	const res = await fetch(url, {
		method: "HEAD",
		redirect: "manual",
		/// ^do not follow redirects to save some time
		headers: params.credentials
			? {
					Authorization: `Bearer ${params.credentials.accessToken}`,
			  }
			: {},
	});
	/// Caution: in the browser, when redirect: "manual", res.status == 0
	return res.type === "opaqueredirect" || (res.status >= 200 && res.status < 400);
}

export async function parseSafetensorsFromModelRepo(params: {
	repo: RepoDesignation;
	hubUrl?: string;
	credentials?: Credentials;
	revision?: string;
}): Promise<ParseFromRepo> {
	const repoId = toRepoId(params.repo);

	if (repoId.type !== "model") {
		throw new TypeError("Only model repos should contain safetensors files.");
	}

	checkCredentials(params.credentials);

	const hubUrl = params.hubUrl ?? HUB_URL;

	const singleUrl = new URL(`${hubUrl}/${repoId.name}/resolve/${params.revision ?? "main"}/${SINGLE_FILE}`);
	const indexUrl = new URL(`${hubUrl}/${repoId.name}/resolve/${params.revision ?? "main"}/${INDEX_FILE}`);
	if (await doesFileExistOnHub(singleUrl, { credentials: params.credentials })) {
		return {
			sharded: false,
			header: await parseSingleFile(singleUrl, { credentials: params.credentials }),
		};
	} else if (await doesFileExistOnHub(indexUrl, { credentials: params.credentials })) {
		return {
			sharded: true,
			...(await parseShardedIndex(indexUrl, { credentials: params.credentials })),
		};
	} else {
		throw new Error("model id does not seem to contain safetensors weights");
	}
}

function computeNumOfParamsByDtypeSingleFile(header: FileHeader): Counter<Dtype> {
	const n = new Counter<Dtype>();
	const tensors = omit(header, "__metadata__");
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	for (const [k, v] of typedEntries(tensors)) {
		if (v.shape.length === 0) {
			continue;
		}
		n.incr(
			v.dtype,
			v.shape.reduce((a, b) => a * b)
		);
	}
	return n;
}

function computeNumOfParamsByDtypeSharded(shardedMap: ShardedHeaders): Counter<Dtype> {
	const n = new Counter<Dtype>();
	for (const v of Object.values(shardedMap)) {
		n.add(computeNumOfParamsByDtypeSingleFile(v));
	}
	return n;
}

export function computeNumOfParamsByDtype(parse: ParseFromRepo): Counter<Dtype> {
	if (parse.sharded) {
		return computeNumOfParamsByDtypeSharded(parse.headers);
	} else {
		return computeNumOfParamsByDtypeSingleFile(parse.header);
	}
}
