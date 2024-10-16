import type { MetadataValue, Version, GGUFMetadata, GGUFTensorInfo, GGUFParseOutput } from "./types";
import { GGMLQuantizationType, GGUFValueType } from "./types";
import { isBackend } from "./utils/isBackend";
import { promisesQueue } from "./utils/promisesQueue";

export type { MetadataBaseValue, MetadataValue, Version, GGUFMetadata, GGUFTensorInfo, GGUFParseOutput } from "./types";
export { GGUFValueType, GGMLFileQuantizationType, GGMLQuantizationType, Architecture } from "./types";
export { GGUF_QUANT_DESCRIPTIONS } from "./quant-descriptions";

export const RE_GGUF_FILE = /\.gguf$/;
export const RE_GGUF_SHARD_FILE = /^(?<prefix>.*?)-(?<shard>\d{5})-of-(?<total>\d{5})\.gguf$/;
const PARALLEL_DOWNLOADS = 20;

export interface GgufShardFileInfo {
	prefix: string;
	shard: string;
	total: string;
}

export function parseGgufShardFilename(filename: string): GgufShardFileInfo | null {
	const match = RE_GGUF_SHARD_FILE.exec(filename);
	if (match && match.groups) {
		return {
			prefix: match.groups["prefix"],
			shard: match.groups["shard"],
			total: match.groups["total"],
		};
	}
	return null;
}

const ggufQuants = Object.values(GGMLQuantizationType).filter((v): v is string => typeof v === "string");
export const GGUF_QUANT_RE = new RegExp(`(?<quant>${ggufQuants.join("|")})` + "(_(?<sizeVariation>[A-Z]+))?");
export const GGUF_QUANT_RE_GLOBAL = new RegExp(GGUF_QUANT_RE, "g");

export function parseGGUFQuantLabel(fname: string): string | undefined {
	const quantLabel = fname.toUpperCase().match(GGUF_QUANT_RE_GLOBAL)?.at(-1); // if there is multiple quant substrings in a name, we prefer the last one
	return quantLabel;
}

const isVersion = (version: number): version is Version => version === 1 || version === 2 || version === 3;

/**
 * Must be `GGUF` at the byte level: `0x47` `0x47` `0x55` `0x46`.
 * Your executor might do little-endian byte order, so it might be
 * check for 0x46554747 and letting the endianness cancel out.
 * Consider being *very* explicit about the byte order here.
 */
const ggufMagicNumber = new Uint8Array([0x47, 0x47, 0x55, 0x46]); /// "GGUF"

function isGGUFValueType(n: number): n is GGUFValueType {
	return typeof GGUFValueType[n] === "string";
}

const HTTP_CHUNK_SIZE = 2 * 10 ** 6; /// 2MB
const HTTP_DATA_LEEWAY = 5 * 10 ** 5; /// 500kb
const HTTP_TOTAL_MAX_SIZE = 50 * 10 ** 6; /// 50MB

/**
 * Internal stateful instance to fetch ranges of HTTP data when needed
 */
class RangeView {
	protected chunk: number;
	private buffer: ArrayBuffer;
	private dataView: DataView;

	get view(): DataView {
		return this.dataView;
	}

	constructor(
		public uri: string,
		private params?: {
			/**
			 * Custom fetch function to use instead of the default one, for example to use a proxy or edit headers.
			 */
			fetch?: typeof fetch;
			additionalFetchHeaders?: Record<string, string>;
		}
	) {
		this.chunk = 0;
		/// TODO(fix typing)
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-ignore
		this.buffer = new ArrayBuffer(0, { maxByteLength: HTTP_TOTAL_MAX_SIZE });
		this.dataView = new DataView(this.buffer);
	}
	/**
	 * Fetch a new chunk from the server
	 */
	async fetchChunk() {
		const range = [this.chunk * HTTP_CHUNK_SIZE, (this.chunk + 1) * HTTP_CHUNK_SIZE - 1];
		const buf = new Uint8Array(
			await (
				await (this.params?.fetch ?? fetch)(this.uri, {
					headers: {
						...(this.params?.additionalFetchHeaders ?? {}),
						Range: `bytes=${range[0]}-${range[1]}`,
					},
				})
			).arrayBuffer()
		);
		this.appendBuffer(buf);
		this.chunk += 1;
	}
	/**
	 * Append new data into the buffer
	 */
	appendBuffer(buf: Uint8Array) {
		/// TODO(fix typing)
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-ignore
		if (ArrayBuffer.prototype.resize) {
			/// TODO(fix typing)
			// eslint-disable-next-line @typescript-eslint/ban-ts-comment
			// @ts-ignore
			this.buffer.resize((this.chunk + 1) * HTTP_CHUNK_SIZE);
			new Uint8Array(this.buffer).set(buf, this.chunk * HTTP_CHUNK_SIZE);
		} else {
			// If the browser does not support ArrayBuffer.resize, we fallback to this polyfill version
			/// TODO(fix typing)
			// eslint-disable-next-line @typescript-eslint/ban-ts-comment
			// @ts-ignore
			const newBuffer = new ArrayBuffer((this.chunk + 1) * HTTP_CHUNK_SIZE, { maxByteLength: HTTP_TOTAL_MAX_SIZE });
			const arrView = new Uint8Array(newBuffer);
			arrView.set(new Uint8Array(this.buffer));
			arrView.set(buf, this.chunk * HTTP_CHUNK_SIZE);
			this.buffer = newBuffer;
			this.dataView = new DataView(this.buffer);
		}
	}
	/**
	 * Check whether we need to fetch a new chunk
	 */
	async fetchChunkIfNeeded(offset: number) {
		if (this.dataView.byteLength - offset < HTTP_DATA_LEEWAY) {
			await this.fetchChunk();
		}
	}
}

/**
 * Internal stateful instance to read ranges of local file when needed.
 * Only usable in with nodejs FS API.
 */
class RangeViewLocalFile extends RangeView {
	/**
	 * Read a new chunk from local file system.
	 */
	override async fetchChunk(): Promise<void> {
		const { FileBlob } = await import("./utils/FileBlob");
		const blob = await FileBlob.create(this.uri);
		const range = [this.chunk * HTTP_CHUNK_SIZE, (this.chunk + 1) * HTTP_CHUNK_SIZE - 1];
		const buffer = await blob.slice(range[0], range[1]).arrayBuffer();
		this.appendBuffer(new Uint8Array(buffer));
		this.chunk += 1;
	}
}

interface Slice<T> {
	value: T;
	length: number;
}

/**
 * Note: A good article about binary data in JS: https://javascript.info/arraybuffer-binary-arrays
 */

function readVersionedSize(view: DataView, byteOffset: number, version: Version, littleEndian: boolean): Slice<bigint> {
	switch (version) {
		case 1: {
			const n = view.getUint32(byteOffset, littleEndian);
			return { value: BigInt(n), length: 4 };
		}
		case 2:
		case 3: {
			return { value: view.getBigUint64(byteOffset, littleEndian), length: 8 };
		}
	}
}

function readString(view: DataView, offset: number, version: Version, littleEndian: boolean): Slice<string> {
	const length = readVersionedSize(view, offset, version, littleEndian);
	const off = length.length;
	const value = new TextDecoder().decode(view.buffer.slice(offset + off, offset + off + Number(length.value)));
	return { value, length: off + Number(length.value) };
}

function readMetadataValue(
	view: DataView,
	type: GGUFValueType,
	offset: number,
	version: Version,
	littleEndian: boolean
): Slice<MetadataValue> {
	switch (type) {
		case GGUFValueType.UINT8:
			return { value: view.getUint8(offset), length: 1 };
		case GGUFValueType.INT8:
			return { value: view.getInt8(offset), length: 1 };
		case GGUFValueType.UINT16:
			return { value: view.getUint16(offset, littleEndian), length: 2 };
		case GGUFValueType.INT16:
			return { value: view.getInt16(offset, littleEndian), length: 2 };
		case GGUFValueType.UINT32:
			return { value: view.getUint32(offset, littleEndian), length: 4 };
		case GGUFValueType.INT32:
			return { value: view.getInt32(offset, littleEndian), length: 4 };
		case GGUFValueType.FLOAT32:
			return { value: view.getFloat32(offset, littleEndian), length: 4 };
		case GGUFValueType.BOOL:
			return { value: view.getUint8(offset) !== 0, length: 1 };
		case GGUFValueType.STRING:
			return readString(view, offset, version, littleEndian);
		case GGUFValueType.ARRAY: {
			const arrayType = view.getUint32(offset, littleEndian);
			const arrayLength = readVersionedSize(view, offset + 4, version, littleEndian);
			let length = 4 + arrayLength.length;
			const arrayValues: MetadataValue[] = [];
			for (let i = 0; i < arrayLength.value; i++) {
				const metadataValue = readMetadataValue(view, arrayType, offset + length, version, littleEndian);
				arrayValues.push(metadataValue.value);
				length += metadataValue.length;
			}
			return { value: arrayValues, length };
		}
		case GGUFValueType.UINT64:
			return { value: view.getBigUint64(offset, littleEndian), length: 8 };
		case GGUFValueType.INT64:
			return { value: view.getBigInt64(offset, littleEndian), length: 8 };
		case GGUFValueType.FLOAT64:
			return { value: view.getFloat64(offset, littleEndian), length: 8 };
	}
}

export async function gguf(
	uri: string,
	params: {
		/**
		 * Custom fetch function to use instead of the default one, for example to use a proxy or edit headers.
		 */
		fetch?: typeof fetch;
		additionalFetchHeaders?: Record<string, string>;
		computeParametersCount: true;
		allowLocalFile?: boolean;
	}
): Promise<GGUFParseOutput & { parameterCount: number }>;
export async function gguf(
	uri: string,
	params?: {
		/**
		 * Custom fetch function to use instead of the default one, for example to use a proxy or edit headers.
		 */
		fetch?: typeof fetch;
		additionalFetchHeaders?: Record<string, string>;
		allowLocalFile?: boolean;
	}
): Promise<GGUFParseOutput>;
export async function gguf(
	uri: string,
	params?: {
		/**
		 * Custom fetch function to use instead of the default one, for example to use a proxy or edit headers.
		 */
		fetch?: typeof fetch;
		additionalFetchHeaders?: Record<string, string>;
		computeParametersCount?: boolean;
		allowLocalFile?: boolean;
	}
): Promise<GGUFParseOutput & { parameterCount?: number }> {
	let r: RangeView;
	if (isBackend) {
		/// On backend, we switch between remote/local file based on protocol
		if (uri.match(/^https?:\/\//)) {
			r = new RangeView(uri, params);
		} else if (params?.allowLocalFile) {
			r = new RangeViewLocalFile(uri, params);
		} else {
			throw new Error("Access to local file is not enabled, please set allowLocalFile to true");
		}
	} else {
		/// On frontend, we only allow using remote file
		if (params?.allowLocalFile) {
			throw new Error("allowLocalFile cannot be used on browser");
		}
		r = new RangeView(uri, params);
	}
	await r.fetchChunk();

	const checkBuffer = (buffer: Uint8Array, header: Uint8Array) => {
		for (let i = 0; i < header.length; i++) {
			if (header[i] !== buffer[i]) {
				return false;
			}
		}
		return true;
	};

	if (!checkBuffer(new Uint8Array(r.view.buffer.slice(0, 4)), ggufMagicNumber)) {
		throw new Error("not a valid gguf file: not starting with GGUF magic number");
	}

	const [littleEndian, version] = (() => {
		/// https://github.com/ggerganov/llama.cpp/issues/3957
		/// Assume this code is always running on little-endian
		/// but wants to be able to parse both endianness
		const version = r.view.getUint32(4, true);
		if (version & 65535) {
			return [true, version];
		} else {
			return [false, r.view.getUint32(4, false)];
		}
	})();

	if (!isVersion(version)) {
		throw new Error(`not a valid gguf file: unsupported version "${version}"`);
	}
	// initial offset after header
	let offset = 8;
	const tensorCount = readVersionedSize(r.view, offset, version, littleEndian);
	offset += tensorCount.length;
	const numKv = readVersionedSize(r.view, offset, version, littleEndian);
	offset += numKv.length;
	const metadata: GGUFMetadata<{ strict: false }> = {
		version,
		tensor_count: tensorCount.value,
		kv_count: numKv.value,
	};

	for (let i = 0; i < numKv.value; i++) {
		await r.fetchChunkIfNeeded(offset);

		// read key
		const keyResult = readString(r.view, offset, version, littleEndian);
		offset += keyResult.length;

		// read value type
		const valueType = r.view.getUint32(offset, littleEndian);
		offset += 4;

		if (!isGGUFValueType(valueType)) {
			throw new Error("Unsupported metadata type: " + valueType);
		}

		let valueResult: ReturnType<typeof readMetadataValue> | undefined;
		while (!valueResult) {
			try {
				// read value
				valueResult = readMetadataValue(r.view, valueType, offset, version, littleEndian);
			} catch (err) {
				if (err instanceof RangeError) {
					await r.fetchChunk();
				} else {
					throw err;
				}
			}
		}
		offset += valueResult.length;
		metadata[keyResult.value] = valueResult.value;
	}

	const tensorInfos: GGUFTensorInfo[] = [];

	for (let i = 0; i < tensorCount.value; i++) {
		await r.fetchChunkIfNeeded(offset);

		// read tensor name
		const keyResult = readString(r.view, offset, version, littleEndian);
		offset += keyResult.length;

		const nDims = r.view.getUint32(offset, littleEndian);
		offset += 4;

		const shape: bigint[] = [];
		for (let dim = 0; dim < nDims; dim++) {
			const shapeDim = readVersionedSize(r.view, offset, version, littleEndian);
			shape.push(shapeDim.value);
			offset += shapeDim.length;
		}

		const type = r.view.getUint32(offset, littleEndian);
		offset += 4;
		const tensorOffset = r.view.getBigUint64(offset, littleEndian);
		offset += 8;

		tensorInfos.push({
			name: keyResult.value,
			n_dims: nDims,
			shape,
			dtype: type,
			offset: tensorOffset,
		});
	}

	if (params?.computeParametersCount) {
		const parameterCount = tensorInfos
			.map(({ shape }) => shape.reduce((acc, val) => acc * Number(val), 1))
			.reduce((acc, val) => acc + val, 0);

		return { metadata, tensorInfos, parameterCount };
	} else {
		return { metadata, tensorInfos };
	}
}

export async function ggufAllShards(
	url: string,
	params?: {
		/**
		 * Custom fetch function to use instead of the default one, for example to use a proxy or edit headers.
		 */
		fetch?: typeof fetch;
		additionalFetchHeaders?: Record<string, string>;
		parallelDownloads?: number;
	}
): Promise<{ shards: GGUFParseOutput[]; parameterCount: number }> {
	const parallelDownloads = params?.parallelDownloads ?? PARALLEL_DOWNLOADS;
	if (parallelDownloads < 1) {
		throw new TypeError("parallelDownloads must be greater than 0");
	}
	const ggufShardFileInfo = parseGgufShardFilename(url);
	if (ggufShardFileInfo) {
		const total = parseInt(ggufShardFileInfo.total);
		const prefix = ggufShardFileInfo.prefix;

		const urls: string[] = [];
		for (let shardIdx = 1; shardIdx <= total; shardIdx++) {
			urls.push(`${prefix}-${shardIdx.toString().padStart(5, "0")}-of-${total.toString().padStart(5, "0")}.gguf`);
		}

		const shards = await promisesQueue(
			urls.map((shardUrl) => () => gguf(shardUrl, { ...params, computeParametersCount: true })),
			parallelDownloads
		);
		return {
			shards,
			parameterCount: shards.map(({ parameterCount }) => parameterCount).reduce((acc, val) => acc + val, 0),
		};
	} else {
		const { metadata, tensorInfos, parameterCount } = await gguf(url, { ...params, computeParametersCount: true });
		return { shards: [{ metadata, tensorInfos }], parameterCount };
	}
}
