import type { MetadataValue, Version, GGUFMetadata, GGUFTypedMetadata, GGUFTensorInfo, GGUFParseOutput } from "./types";
import { GGUFValueType } from "./types";
import { isBackend } from "./utils/isBackend";
import { promisesQueue } from "./utils/promisesQueue";

export type {
	MetadataBaseValue,
	MetadataValue,
	Version,
	GGUFMetadata,
	GGUFTypedMetadata,
	GGUFTensorInfo,
	GGUFParseOutput,
	GGUFMetadataOptions,
} from "./types";
export { GGUFValueType, GGMLQuantizationType, Architecture } from "./types";
export { GGUF_QUANT_DESCRIPTIONS } from "./quant-descriptions";
export {
	parseGGUFQuantLabel,
	GGUF_QUANT_RE,
	GGUF_QUANT_RE_GLOBAL,
	GGUF_QUANT_ORDER,
	findNearestQuantType,
	GGMLFileQuantizationType,
} from "@huggingface/tasks";

export const RE_GGUF_FILE = /\.gguf$/;
export const RE_GGUF_SHARD_FILE = /^(?<prefix>.*?)-(?<shard>\d{5})-of-(?<total>\d{5})\.gguf$/;
const GGUF_DEFAULT_ALIGNMENT = 32; // defined in ggml.h
const GGML_PAD = (x: number, n: number) => (x + n - 1) & ~(n - 1); // defined in ggml.h
const PARALLEL_DOWNLOADS = 20;

/**
 * GGUF magic number: "GGUF" in bytes
 * Must be `GGUF` at the byte level: `0x47` `0x47` `0x55` `0x46`.
 */
const GGUF_MAGIC_NUMBER = new Uint8Array([0x47, 0x47, 0x55, 0x46]);

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

const isVersion = (version: number): version is Version => version === 1 || version === 2 || version === 3;

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
		fetch?: typeof fetch;
		additionalFetchHeaders?: Record<string, string>;
		typedMetadata: true;
		allowLocalFile?: boolean;
	}
): Promise<GGUFParseOutput & { typedMetadata: GGUFTypedMetadata }>;
export async function gguf(
	uri: string,
	params: {
		fetch?: typeof fetch;
		additionalFetchHeaders?: Record<string, string>;
		typedMetadata: true;
		computeParametersCount: true;
		allowLocalFile?: boolean;
	}
): Promise<GGUFParseOutput & { parameterCount: number; typedMetadata: GGUFTypedMetadata }>;
export async function gguf(
	uri: string,
	params: {
		fetch?: typeof fetch;
		additionalFetchHeaders?: Record<string, string>;
		computeParametersCount: true;
		allowLocalFile?: boolean;
	}
): Promise<GGUFParseOutput & { parameterCount: number }>;
export async function gguf(
	uri: string,
	params?: {
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
		typedMetadata?: boolean;
		computeParametersCount?: boolean;
		allowLocalFile?: boolean;
	}
): Promise<GGUFParseOutput & { parameterCount?: number; typedMetadata?: GGUFTypedMetadata }> {
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

	if (!checkBuffer(new Uint8Array(r.view.buffer.slice(0, 4)), GGUF_MAGIC_NUMBER)) {
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

	let typedMetadata: GGUFTypedMetadata | undefined;
	if (params?.typedMetadata) {
		typedMetadata = {
			version: { value: version, type: GGUFValueType.UINT32 },
			tensor_count: {
				value: tensorCount.value,
				type: version === 1 ? GGUFValueType.UINT32 : GGUFValueType.UINT64,
			},
			kv_count: {
				value: numKv.value,
				type: version === 1 ? GGUFValueType.UINT32 : GGUFValueType.UINT64,
			},
		};
	}

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
		if (typedMetadata) {
			const typedEntry: {
				value: MetadataValue;
				type: GGUFValueType;
				subType?: GGUFValueType;
			} = {
				value: valueResult.value,
				type: valueType,
			};

			// For arrays, read the subType (element type)
			if (valueType === GGUFValueType.ARRAY) {
				// Array type is stored at the beginning of the value data
				// We need to read it from the original offset (before reading the value)
				const arrayTypeOffset = offset - valueResult.length;
				const arraySubType = r.view.getUint32(arrayTypeOffset, littleEndian);
				if (isGGUFValueType(arraySubType)) {
					typedEntry.subType = arraySubType;
				}
			}

			typedMetadata[keyResult.value] = typedEntry;
		}
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

	// calculate absolute offset of tensor data
	const alignment: number = Number(metadata["general.alignment"] ?? GGUF_DEFAULT_ALIGNMENT);
	const tensorDataOffset = BigInt(GGML_PAD(offset, alignment));

	if (params?.computeParametersCount && params?.typedMetadata) {
		const parameterCount = tensorInfos
			.map(({ shape }) => shape.reduce((acc, val) => acc * Number(val), 1))
			.reduce((acc, val) => acc + val, 0);

		return {
			metadata,
			tensorInfos,
			tensorDataOffset,
			littleEndian,
			parameterCount,
			typedMetadata: typedMetadata as GGUFTypedMetadata,
		} as GGUFParseOutput & { parameterCount: number; typedMetadata: GGUFTypedMetadata };
	} else if (params?.computeParametersCount) {
		const parameterCount = tensorInfos
			.map(({ shape }) => shape.reduce((acc, val) => acc * Number(val), 1))
			.reduce((acc, val) => acc + val, 0);

		return {
			metadata,
			tensorInfos,
			tensorDataOffset,
			littleEndian,
			parameterCount,
		} as GGUFParseOutput & { parameterCount: number };
	} else if (params?.typedMetadata) {
		return {
			metadata,
			tensorInfos,
			tensorDataOffset,
			littleEndian,
			typedMetadata: typedMetadata as GGUFTypedMetadata,
		} as GGUFParseOutput & { typedMetadata: GGUFTypedMetadata };
	} else {
		return { metadata, tensorInfos, tensorDataOffset, littleEndian } as GGUFParseOutput;
	}
}

/**
 * Helper functions for serializing GGUF data to binary format
 */

function writeVersionedSize(version: Version, value: bigint, littleEndian: boolean): Uint8Array {
	switch (version) {
		case 1: {
			const buffer = new ArrayBuffer(4);
			const view = new DataView(buffer);
			view.setUint32(0, Number(value), littleEndian);
			return new Uint8Array(buffer);
		}
		case 2:
		case 3: {
			const buffer = new ArrayBuffer(8);
			const view = new DataView(buffer);
			view.setBigUint64(0, value, littleEndian);
			return new Uint8Array(buffer);
		}
	}
}

function writeString(value: string, version: Version, littleEndian: boolean): Uint8Array {
	const stringBytes = new TextEncoder().encode(value);
	const lengthBytes = writeVersionedSize(version, BigInt(stringBytes.length), littleEndian);

	const result = new Uint8Array(lengthBytes.length + stringBytes.length);
	result.set(lengthBytes, 0);
	result.set(stringBytes, lengthBytes.length);
	return result;
}

function writeMetadataValue(
	value: MetadataValue,
	type: GGUFValueType,
	version: Version,
	littleEndian: boolean,
	subType?: GGUFValueType
): Uint8Array {
	switch (type) {
		case GGUFValueType.UINT8: {
			const buffer = new ArrayBuffer(1);
			const view = new DataView(buffer);
			view.setUint8(0, value as number);
			return new Uint8Array(buffer);
		}
		case GGUFValueType.INT8: {
			const buffer = new ArrayBuffer(1);
			const view = new DataView(buffer);
			view.setInt8(0, value as number);
			return new Uint8Array(buffer);
		}
		case GGUFValueType.UINT16: {
			const buffer = new ArrayBuffer(2);
			const view = new DataView(buffer);
			view.setUint16(0, value as number, littleEndian);
			return new Uint8Array(buffer);
		}
		case GGUFValueType.INT16: {
			const buffer = new ArrayBuffer(2);
			const view = new DataView(buffer);
			view.setInt16(0, value as number, littleEndian);
			return new Uint8Array(buffer);
		}
		case GGUFValueType.UINT32: {
			const buffer = new ArrayBuffer(4);
			const view = new DataView(buffer);
			view.setUint32(0, value as number, littleEndian);
			return new Uint8Array(buffer);
		}
		case GGUFValueType.INT32: {
			const buffer = new ArrayBuffer(4);
			const view = new DataView(buffer);
			view.setInt32(0, value as number, littleEndian);
			return new Uint8Array(buffer);
		}
		case GGUFValueType.FLOAT32: {
			const buffer = new ArrayBuffer(4);
			const view = new DataView(buffer);
			view.setFloat32(0, value as number, littleEndian);
			return new Uint8Array(buffer);
		}
		case GGUFValueType.BOOL: {
			const buffer = new ArrayBuffer(1);
			const view = new DataView(buffer);
			view.setUint8(0, value ? 1 : 0);
			return new Uint8Array(buffer);
		}
		case GGUFValueType.STRING: {
			return writeString(value as string, version, littleEndian);
		}
		case GGUFValueType.ARRAY: {
			if (!subType) {
				throw new Error("Array type requires subType to be specified");
			}
			const arrayValue = value as MetadataValue[];

			// Write array type (4 bytes)
			const arrayTypeBuffer = new ArrayBuffer(4);
			const arrayTypeView = new DataView(arrayTypeBuffer);
			arrayTypeView.setUint32(0, subType, littleEndian);
			const arrayTypeBytes = new Uint8Array(arrayTypeBuffer);

			// Write array length
			const lengthBytes = writeVersionedSize(version, BigInt(arrayValue.length), littleEndian);

			// Write array elements
			const elementBytes: Uint8Array[] = [];
			for (const element of arrayValue) {
				elementBytes.push(writeMetadataValue(element, subType, version, littleEndian));
			}

			// Combine all parts
			const totalLength =
				arrayTypeBytes.length + lengthBytes.length + elementBytes.reduce((sum, bytes) => sum + bytes.length, 0);
			const result = new Uint8Array(totalLength);
			let offset = 0;

			result.set(arrayTypeBytes, offset);
			offset += arrayTypeBytes.length;
			result.set(lengthBytes, offset);
			offset += lengthBytes.length;

			for (const bytes of elementBytes) {
				result.set(bytes, offset);
				offset += bytes.length;
			}

			return result;
		}
		case GGUFValueType.UINT64: {
			const buffer = new ArrayBuffer(8);
			const view = new DataView(buffer);
			view.setBigUint64(0, value as bigint, littleEndian);
			return new Uint8Array(buffer);
		}
		case GGUFValueType.INT64: {
			const buffer = new ArrayBuffer(8);
			const view = new DataView(buffer);
			view.setBigInt64(0, value as bigint, littleEndian);
			return new Uint8Array(buffer);
		}
		case GGUFValueType.FLOAT64: {
			const buffer = new ArrayBuffer(8);
			const view = new DataView(buffer);
			view.setFloat64(0, value as number, littleEndian);
			return new Uint8Array(buffer);
		}
		default:
			throw new Error(`Unsupported value type: ${type}`);
	}
}

/**
 * Serialize a complete GGUF file including metadata, tensor info, and alignment.
 * This creates a complete GGUF header that can be combined with tensor data.
 *
 * @param typedMetadata - The typed metadata to serialize
 * @param tensorInfos - The tensor information array
 * @param options - Serialization options
 * @returns A Uint8Array containing the complete GGUF header with proper alignment
 */
export function serializeGgufHeader(
	typedMetadata: GGUFTypedMetadata,
	tensorInfos: GGUFTensorInfo[],
	options: {
		/**
		 * Whether to use little endian byte order
		 * @default true
		 */
		littleEndian?: boolean;
		/**
		 * Alignment for tensor data
		 * @default 32
		 */
		alignment?: number;
	} = {}
): Uint8Array {
	const littleEndian = options.littleEndian ?? true;
	const alignment = options.alignment ?? 32; // GGUF_DEFAULT_ALIGNMENT
	const version = typedMetadata.version.value;

	// Start with GGUF magic number: "GGUF"

	// Write version (4 bytes, UINT32)
	const versionBuffer = new ArrayBuffer(4);
	const versionView = new DataView(versionBuffer);
	versionView.setUint32(0, version, littleEndian);
	const versionBytes = new Uint8Array(versionBuffer);

	// Write tensor count
	const tensorCountBytes = writeVersionedSize(version, BigInt(tensorInfos.length), littleEndian);

	// Count key-value pairs (excluding the built-in fields: version, tensor_count, kv_count)
	const kvEntries = Object.entries(typedMetadata).filter(
		([key]) => !["version", "tensor_count", "kv_count"].includes(key)
	);
	const kvCount = BigInt(kvEntries.length);

	// Write kv count
	const kvCountBytes = writeVersionedSize(version, kvCount, littleEndian);

	// Write all key-value pairs
	const kvBytes: Uint8Array[] = [];

	for (const [key, entry] of kvEntries) {
		// Write key (string)
		const keyBytes = writeString(key, version, littleEndian);
		kvBytes.push(keyBytes);

		// Write value type (4 bytes, UINT32)
		const valueTypeBuffer = new ArrayBuffer(4);
		const valueTypeView = new DataView(valueTypeBuffer);
		valueTypeView.setUint32(0, entry.type, littleEndian);
		const valueTypeBytes = new Uint8Array(valueTypeBuffer);
		kvBytes.push(valueTypeBytes);

		// Write value
		if (entry.value === undefined) {
			throw new Error(`Value for key "${key}" is undefined`);
		}
		const valueBytes = writeMetadataValue(
			entry.value,
			entry.type,
			version,
			littleEndian,
			"subType" in entry ? entry.subType : undefined
		);
		kvBytes.push(valueBytes);
	}

	// Write tensor info section
	const tensorInfoBytes: Uint8Array[] = [];

	for (const tensorInfo of tensorInfos) {
		// Write tensor name
		const nameBytes = writeString(tensorInfo.name, version, littleEndian);
		tensorInfoBytes.push(nameBytes);

		// Write n_dims (4 bytes, UINT32)
		const nDimsBuffer = new ArrayBuffer(4);
		const nDimsView = new DataView(nDimsBuffer);
		nDimsView.setUint32(0, tensorInfo.n_dims, littleEndian);
		const nDimsBytes = new Uint8Array(nDimsBuffer);
		tensorInfoBytes.push(nDimsBytes);

		// Write shape dimensions
		for (const dim of tensorInfo.shape) {
			const dimBytes = writeVersionedSize(version, dim, littleEndian);
			tensorInfoBytes.push(dimBytes);
		}

		// Write dtype (4 bytes, UINT32)
		const dtypeBuffer = new ArrayBuffer(4);
		const dtypeView = new DataView(dtypeBuffer);
		dtypeView.setUint32(0, tensorInfo.dtype, littleEndian);
		const dtypeBytes = new Uint8Array(dtypeBuffer);
		tensorInfoBytes.push(dtypeBytes);

		// Write offset (8 bytes, UINT64)
		const offsetBuffer = new ArrayBuffer(8);
		const offsetView = new DataView(offsetBuffer);
		offsetView.setBigUint64(0, tensorInfo.offset, littleEndian);
		const offsetBytes = new Uint8Array(offsetBuffer);
		tensorInfoBytes.push(offsetBytes);
	}

	// Calculate total size before alignment
	const preAlignmentSize =
		GGUF_MAGIC_NUMBER.length +
		versionBytes.length +
		tensorCountBytes.length +
		kvCountBytes.length +
		kvBytes.reduce((sum, bytes) => sum + bytes.length, 0) +
		tensorInfoBytes.reduce((sum, bytes) => sum + bytes.length, 0);

	// Calculate aligned size
	const GGML_PAD = (x: number, n: number) => (x + n - 1) & ~(n - 1);
	const alignedSize = GGML_PAD(preAlignmentSize, alignment);

	// Create result array with padding
	const result = new Uint8Array(alignedSize);
	let offset = 0;

	// Magic number
	result.set(GGUF_MAGIC_NUMBER, offset);
	offset += GGUF_MAGIC_NUMBER.length;

	// Version
	result.set(versionBytes, offset);
	offset += versionBytes.length;

	// Tensor count
	result.set(tensorCountBytes, offset);
	offset += tensorCountBytes.length;

	// KV count
	result.set(kvCountBytes, offset);
	offset += kvCountBytes.length;

	// All key-value pairs
	for (const bytes of kvBytes) {
		result.set(bytes, offset);
		offset += bytes.length;
	}

	// All tensor info
	for (const bytes of tensorInfoBytes) {
		result.set(bytes, offset);
		offset += bytes.length;
	}

	// Padding bytes (zeros) are already initialized in the Uint8Array
	return result;
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
		allowLocalFile?: boolean;
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
		const { metadata, tensorInfos, tensorDataOffset, littleEndian, parameterCount } = await gguf(url, {
			...params,
			computeParametersCount: true,
		});
		return { shards: [{ metadata, tensorInfos, tensorDataOffset, littleEndian }], parameterCount };
	}
}
