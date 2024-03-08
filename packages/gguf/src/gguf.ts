type MetadataBaseValue = string | number | bigint | boolean;
type MetadataValue = MetadataBaseValue | MetadataBaseValue[] | MetadataValue[]; /// recursive as arrays can be nested.

type Version = 1 | 2 | 3;
const isVersion = (version: number): version is Version => version === 1 || version === 2 || version === 3;

const ggufMagicNumber = [0x47, 0x47, 0x55, 0x46]; /// "GGUF"

export enum GGMLQuantizationType {
	F32 = 0,
	F16 = 1,
	Q4_0 = 2,
	Q4_1 = 3,
	Q5_0 = 6,
	Q5_1 = 7,
	Q8_0 = 8,
	Q8_1 = 9,
	Q2_K = 10,
	Q3_K = 11,
	Q4_K = 12,
	Q5_K = 13,
	Q6_K = 14,
	Q8_K = 15,
	IQ2_XXS = 16,
	IQ2_XS = 17,
	IQ3_XXS = 18,
	IQ1_S = 19,
	IQ4_NL = 20,
	IQ3_S = 21,
	IQ2_S = 22,
	IQ4_XS = 23,
}

enum GGUFValueType {
	UINT8 = 0,
	INT8 = 1,
	UINT16 = 2,
	INT16 = 3,
	UINT32 = 4,
	INT32 = 5,
	FLOAT32 = 6,
	BOOL = 7,
	STRING = 8,
	ARRAY = 9,
	UINT64 = 10,
	INT64 = 11,
	FLOAT64 = 12,
}
function isGGUFValueType(n: number): n is GGUFValueType {
	return typeof GGUFValueType[n] === "string";
}

const HTTP_CHUNK_SIZE = 2 * 10 ** 6; /// 2MB
const HTTP_DATA_LEEWAY = 5 * 10 ** 5; /// 500kb

/**
 * Internal stateful instance to fetch ranges of HTTP data when needed
 */
class RangeView {
	private chunk: number;
	private buffer: ArrayBuffer;

	readonly view: DataView;

	constructor(public url: string) {
		this.chunk = 0;
		/// TODO(fix typing)
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-ignore
		this.buffer = new ArrayBuffer(0, { maxByteLength: 50 * 10 ** 6 });
		this.view = new DataView(this.buffer);
	}
	/**
	 * Fetch a new chunk from the server
	 */
	async fetchChunk() {
		const range = [this.chunk * HTTP_CHUNK_SIZE, (this.chunk + 1) * HTTP_CHUNK_SIZE - 1];
		const buf = new Uint8Array(
			await (
				await fetch(this.url, {
					headers: {
						Range: `bytes=${range[0]}-${range[1]}`,
					},
				})
			).arrayBuffer()
		);
		/// TODO(fix typing)
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-ignore
		this.buffer.resize((this.chunk + 1) * HTTP_CHUNK_SIZE);
		new Uint8Array(this.buffer).set(buf, this.chunk * HTTP_CHUNK_SIZE);
		this.chunk += 1;
	}
	/**
	 * Check whether we need to fetch a new chunk
	 */
	async check(offset: number) {
		if (this.view.byteLength - offset < HTTP_DATA_LEEWAY) {
			await this.fetchChunk();
		}
	}
}

function readVersionedSize(view: DataView, byteOffset: number, version: Version): bigint {
	switch (version) {
		case 1: {
			const n = view.getUint32(byteOffset, true);
			return BigInt(n);
		}
		case 2:
		case 3: {
			return view.getBigUint64(byteOffset, true);
		}
	}
}

function readString(view: DataView, offset: number): { value: string; newOffset: number } {
	const length = view.getBigUint64(offset, true);
	const value = new TextDecoder().decode(view.buffer.slice(offset + 8, offset + 8 + Number(length)));
	return { value, newOffset: offset + 8 + Number(length) };
}

function readMetadataValue(
	view: DataView,
	type: GGUFValueType,
	offset: number
): { value: MetadataValue; newOffset: number } {
	switch (type) {
		case GGUFValueType.UINT8:
			return { value: view.getUint8(offset), newOffset: offset + 1 };
		case GGUFValueType.INT8:
			return { value: view.getInt8(offset), newOffset: offset + 1 };
		case GGUFValueType.UINT16:
			return { value: view.getUint16(offset, true), newOffset: offset + 2 };
		case GGUFValueType.INT16:
			return { value: view.getInt16(offset, true), newOffset: offset + 2 };
		case GGUFValueType.UINT32:
			return { value: view.getUint32(offset, true), newOffset: offset + 4 };
		case GGUFValueType.INT32:
			return { value: view.getInt32(offset, true), newOffset: offset + 4 };
		case GGUFValueType.FLOAT32:
			return { value: view.getFloat32(offset, true), newOffset: offset + 4 };
		case GGUFValueType.BOOL:
			return { value: view.getUint8(offset) !== 0, newOffset: offset + 1 };
		case GGUFValueType.STRING:
			return readString(view, offset);
		case GGUFValueType.ARRAY: {
			const arrayType = view.getUint32(offset, true);
			const arrayLength = view.getBigUint64(offset + 4, true);
			let arrayOffset = offset + 12;
			const arrayValues: MetadataValue[] = [];
			for (let i = 0; i < arrayLength; i++) {
				const { value, newOffset } = readMetadataValue(view, arrayType, arrayOffset);
				arrayValues.push(value);
				arrayOffset = newOffset;
			}
			return { value: arrayValues, newOffset: arrayOffset };
		}
		case GGUFValueType.UINT64:
			return { value: view.getBigUint64(offset, true), newOffset: offset + 8 };
		case GGUFValueType.INT64:
			return { value: view.getBigInt64(offset, true), newOffset: offset + 8 };
		case GGUFValueType.FLOAT64:
			return { value: view.getFloat64(offset, true), newOffset: offset + 8 };
	}
}

export type GGUFMetadata = {
	version: Version;
	tensor_count: bigint;
	kv_count: bigint;
} & Record<string, MetadataValue>;

export interface GGUFTensorInfo {
	name: string;
	n_dims: number;
	shape: bigint[];
	type: GGMLQuantizationType;
	offset: bigint;
}

export interface GGUFParseOutput {
	metadata: GGUFMetadata;
	tensorInfos: GGUFTensorInfo[];
}

export async function gguf(url: string): Promise<GGUFParseOutput> {
	const r = new RangeView(url);
	await r.fetchChunk();

	if (r.view.getUint32(0, true) !== Buffer.from(ggufMagicNumber).readInt32LE()) {
		throw new Error("not a valid gguf file: no gguf magic number");
	}

	const version = r.view.getUint32(4, true);
	if (!isVersion(version)) {
		throw new Error("not a valid gguf file: unsupported version");
	}
	const tensorCount = readVersionedSize(r.view, 8, version);
	const numKv = readVersionedSize(r.view, 16, version);

	const metadata: GGUFMetadata = {
		version,
		tensor_count: tensorCount,
		kv_count: numKv,
	};
	// initial offset after header
	let offset = 24;

	for (let i = 0; i < numKv; i++) {
		await r.check(offset);

		// read key
		const keyResult = readString(r.view, offset);
		offset = keyResult.newOffset;

		// read value type
		const valueType = r.view.getUint32(offset, true);
		offset += 4;

		if (!isGGUFValueType(valueType)) {
			throw new Error("Unsupported metadata type: " + valueType);
		}

		let valueResult: { value: MetadataValue; newOffset: number } | undefined;
		while (!valueResult) {
			try {
				// read value
				valueResult = readMetadataValue(r.view, valueType, offset);
			} catch (err) {
				if (err instanceof RangeError) {
					await r.fetchChunk();
				} else {
					throw err;
				}
			}
		}
		offset = valueResult.newOffset;
		metadata[keyResult.value] = valueResult.value;
	}

	const tensorInfos: GGUFTensorInfo[] = [];

	for (let i = 0; i < tensorCount; i++) {
		await r.check(offset);

		// read tensor name
		const keyResult = readString(r.view, offset);
		offset = keyResult.newOffset;

		const nDims = r.view.getUint32(offset, true);
		offset += 4;

		const shape: bigint[] = [];
		for (let dim = 0; dim < nDims; dim++) {
			shape.push(r.view.getBigUint64(offset, true));
			offset += 8;
		}

		const type = r.view.getUint32(offset, true);
		offset += 4;
		const tensorOffset = r.view.getBigUint64(offset, true);
		offset += 8;

		tensorInfos.push({
			name: keyResult.value,
			n_dims: nDims,
			shape,
			type,
			offset: tensorOffset,
		});
	}

	return { metadata, tensorInfos };
}
