type MetadataBaseValue = string | number | bigint | boolean;
type MetadataValue = MetadataBaseValue | MetadataBaseValue[] | MetadataValue[]; /// recursive as arrays can be nested.

type Version = 1 | 2 | 3;
const isVersion = (version: number): version is Version => version === 1 || version === 2 || version === 3;

const ggufMagicNumber = new Uint8Array([0x47, 0x47, 0x55, 0x46]); /// "GGUF"

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
const HTTP_TOTAL_MAX_SIZE = 50 * 10 ** 6; /// 50MB

/**
 * Internal stateful instance to fetch ranges of HTTP data when needed
 */
class RangeView {
	private chunk: number;
	private buffer: ArrayBuffer;
	private fetch: typeof fetch;

	readonly view: DataView;

	constructor(
		public url: string,
		params?: {
			/**
			 * Custom fetch function to use instead of the default one, for example to use a proxy or edit headers.
			 */
			fetch?: typeof fetch;
		}
	) {
		this.chunk = 0;
		/// TODO(fix typing)
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-ignore
		this.buffer = new ArrayBuffer(0, { maxByteLength: HTTP_TOTAL_MAX_SIZE });
		this.view = new DataView(this.buffer);
		this.fetch = params?.fetch ?? fetch;
	}
	/**
	 * Fetch a new chunk from the server
	 */
	async fetchChunk() {
		const range = [this.chunk * HTTP_CHUNK_SIZE, (this.chunk + 1) * HTTP_CHUNK_SIZE - 1];
		const buf = new Uint8Array(
			await (
				await this.fetch(this.url, {
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
	async fetchChunkIfNeeded(offset: number) {
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

function readString(view: DataView, offset: number): { value: string; length: number } {
	const length = view.getBigUint64(offset, true);
	const value = new TextDecoder().decode(view.buffer.slice(offset + 8, offset + 8 + Number(length)));
	return { value, length: 8 + Number(length) };
}

function readMetadataValue(
	view: DataView,
	type: GGUFValueType,
	offset: number
): { value: MetadataValue; length: number } {
	switch (type) {
		case GGUFValueType.UINT8:
			return { value: view.getUint8(offset), length: 1 };
		case GGUFValueType.INT8:
			return { value: view.getInt8(offset), length: 1 };
		case GGUFValueType.UINT16:
			return { value: view.getUint16(offset, true), length: 2 };
		case GGUFValueType.INT16:
			return { value: view.getInt16(offset, true), length: 2 };
		case GGUFValueType.UINT32:
			return { value: view.getUint32(offset, true), length: 4 };
		case GGUFValueType.INT32:
			return { value: view.getInt32(offset, true), length: 4 };
		case GGUFValueType.FLOAT32:
			return { value: view.getFloat32(offset, true), length: 4 };
		case GGUFValueType.BOOL:
			return { value: view.getUint8(offset) !== 0, length: 1 };
		case GGUFValueType.STRING:
			return readString(view, offset);
		case GGUFValueType.ARRAY: {
			const arrayType = view.getUint32(offset, true);
			const arrayLength = view.getBigUint64(offset + 4, true);
			let length = 12;
			const arrayValues: MetadataValue[] = [];
			for (let i = 0; i < arrayLength; i++) {
				const { value, length: _length } = readMetadataValue(view, arrayType, offset + length);
				arrayValues.push(value);
				length += _length;
			}
			return { value: arrayValues, length };
		}
		case GGUFValueType.UINT64:
			return { value: view.getBigUint64(offset, true), length: 8 };
		case GGUFValueType.INT64:
			return { value: view.getBigInt64(offset, true), length: 8 };
		case GGUFValueType.FLOAT64:
			return { value: view.getFloat64(offset, true), length: 8 };
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
	dtype: GGMLQuantizationType;
	offset: bigint;
}

export interface GGUFParseOutput {
	metadata: GGUFMetadata;
	tensorInfos: GGUFTensorInfo[];
}

export async function gguf(
	url: string,
	params?: {
		/**
		 * Custom fetch function to use instead of the default one, for example to use a proxy or edit headers.
		 */
		fetch?: typeof fetch;
	}
): Promise<GGUFParseOutput> {
	const r = new RangeView(url, params);
	await r.fetchChunk();

	if (r.view.getUint32(0, true) !== new DataView(ggufMagicNumber.buffer).getUint32(0, true)) {
		throw new Error("not a valid gguf file: not starting with GGUF magic number");
	}

	const version = r.view.getUint32(4, true);
	if (!isVersion(version)) {
		throw new Error(`not a valid gguf file: unsupported version "${version}"`);
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
		await r.fetchChunkIfNeeded(offset);

		// read key
		const keyResult = readString(r.view, offset);
		offset += keyResult.length;

		// read value type
		const valueType = r.view.getUint32(offset, true);
		offset += 4;

		if (!isGGUFValueType(valueType)) {
			throw new Error("Unsupported metadata type: " + valueType);
		}

		let valueResult: ReturnType<typeof readMetadataValue> | undefined;
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
		offset += valueResult.length;
		metadata[keyResult.value] = valueResult.value;
	}

	const tensorInfos: GGUFTensorInfo[] = [];

	for (let i = 0; i < tensorCount; i++) {
		await r.fetchChunkIfNeeded(offset);

		// read tensor name
		const keyResult = readString(r.view, offset);
		offset += keyResult.length;

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
			dtype: type,
			offset: tensorOffset,
		});
	}

	return { metadata, tensorInfos };
}
