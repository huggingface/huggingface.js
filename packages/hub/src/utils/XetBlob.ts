import { HUB_URL } from "../consts";
import { createApiError } from "../error";
import type { CredentialsParams, RepoDesignation, RepoId } from "../types/public";
import { checkCredentials } from "./checkCredentials";
import { toRepoId } from "./toRepoId";
import { decompress as lz4_decompress } from "../vendor/lz4js";

const JWT_SAFETY_PERIOD = 60_000;
const JWT_CACHE_SIZE = 1_000;

type XetBlobCreateOptions = {
	/**
	 * Custom fetch function to use instead of the default one, for example to use a proxy or edit headers.
	 */
	fetch?: typeof fetch;
	repo: RepoDesignation;
	hash: string;
	hubUrl?: string;
	size: number;
} & Partial<CredentialsParams>;

interface ReconstructionInfo {
	/**
	 * List of CAS blocks
	 */
	terms: Array<{
		/** Hash of the CAS block */
		hash: string;
		/** Total uncompressed length of data of the chunks from range.start to range.end - 1 */
		unpacked_length: number;
		/** Chunks. Eg start: 10, end: 100 = chunks 10-99 */
		range: { start: number; end: number };
	}>;

	/**
	 * Dictionnary of CAS block hash => list of ranges in the block + url to fetch it
	 */
	fetch_info: Record<
		string,
		Array<{
			url: string;
			/** Chunk range */
			range: { start: number; end: number };
			/** Byte range, when making the call to the URL */
			url_range: { start: number; end: number };
		}>
	>;
	/**
	 * When doing a range request, the offset into the term's uncompressed data. Can be multiple chunks' worth of data.
	 */
	offset_into_first_range: number;
}

enum CompressionScheme {
	None = 0,
	LZ4 = 1,
	ByteGroupingLZ4 = 2,
}

const compressionSchemeLabels: Record<CompressionScheme, string> = {
	[CompressionScheme.None]: "None",
	[CompressionScheme.LZ4]: "LZ4",
	[CompressionScheme.ByteGroupingLZ4]: "ByteGroupingLZ4",
};

interface ChunkHeader {
	version: number; // u8, 1 byte
	compressed_length: number; // 3 * u8, 3 bytes
	compression_scheme: CompressionScheme; // u8, 1 byte
	uncompressed_length: number; // 3 * u8, 3 bytes
}

const CHUNK_HEADER_BYTES = 8;

/**
 * XetBlob is a blob implementation that fetches data directly from the Xet storage
 */
export class XetBlob extends Blob {
	fetch: typeof fetch;
	accessToken?: string;
	repoId: RepoId;
	hubUrl: string;
	hash: string;
	start = 0;
	end = 0;
	reconstructionInfo: ReconstructionInfo | undefined;

	constructor(params: XetBlobCreateOptions) {
		super([]);

		this.fetch = params.fetch ?? fetch.bind(globalThis);
		this.accessToken = checkCredentials(params);
		this.repoId = toRepoId(params.repo);
		this.hubUrl = params.hubUrl ?? HUB_URL;
		this.end = params.size;
		this.hash = params.hash;
		this.hubUrl;
	}

	override get size(): number {
		return this.end - this.start;
	}

	#clone() {
		const blob = new XetBlob({
			fetch: this.fetch,
			repo: this.repoId,
			hash: this.hash,
			hubUrl: this.hubUrl,
			size: this.size,
		});

		blob.accessToken = this.accessToken;
		blob.start = this.start;
		blob.end = this.end;
		blob.reconstructionInfo = this.reconstructionInfo;

		return blob;
	}

	override slice(start = 0, end = this.size): XetBlob {
		if (start < 0 || end < 0) {
			new TypeError("Unsupported negative start/end on XetBlob.slice");
		}

		const slice = this.#clone();

		slice.start = this.start + start;
		slice.end = Math.min(this.start + end, this.end);

		if (slice.start !== this.start || slice.end !== this.end) {
			slice.reconstructionInfo = undefined;
		}

		return slice;
	}

	#reconstructionInfoPromise?: Promise<ReconstructionInfo>;

	#loadReconstructionInfo() {
		if (this.#reconstructionInfoPromise) {
			return this.#reconstructionInfoPromise;
		}

		this.#reconstructionInfoPromise = (async () => {
			const connParams = await getAccessToken(this.repoId, this.accessToken, this.fetch, this.hubUrl);

			// console.log(
			// 	`curl '${connParams.casUrl}/reconstruction/${this.hash}' -H 'Authorization: Bearer ${connParams.accessToken}'`
			// );

			const resp = await this.fetch(`${connParams.casUrl}/reconstruction/${this.hash}`, {
				headers: {
					Authorization: `Bearer ${connParams.accessToken}`,
					Range: `bytes=${this.start}-${this.end - 1}`,
				},
			});

			if (!resp.ok) {
				throw await createApiError(resp);
			}

			this.reconstructionInfo = (await resp.json()) as ReconstructionInfo;

			return this.reconstructionInfo;
		})().finally(() => (this.#reconstructionInfoPromise = undefined));

		return this.#reconstructionInfoPromise;
	}

	async #fetch(): Promise<ReadableStream<Uint8Array>> {
		if (!this.reconstructionInfo) {
			await this.#loadReconstructionInfo();
		}

		async function* readData(
			reconstructionInfo: ReconstructionInfo,
			customFetch: typeof fetch,
			maxBytes: number,
			reloadReconstructionInfo: () => Promise<ReconstructionInfo>
		) {
			let totalBytesRead = 0;
			let readBytesToSkip = reconstructionInfo.offset_into_first_range;

			for (const term of reconstructionInfo.terms) {
				if (totalBytesRead >= maxBytes) {
					break;
				}

				const fetchInfo = reconstructionInfo.fetch_info[term.hash].find(
					(info) => info.range.start <= term.range.start && info.range.end >= term.range.end
				);

				if (!fetchInfo) {
					throw new Error(
						`Failed to find fetch info for term ${term.hash} and range ${term.range.start}-${term.range.end}`
					);
				}

				let resp = await customFetch(fetchInfo.url, {
					headers: {
						Range: `bytes=${fetchInfo.url_range.start}-${fetchInfo.url_range.end}`,
					},
				});

				if (resp.status === 403) {
					// In case it's expired
					reconstructionInfo = await reloadReconstructionInfo();
					resp = await customFetch(fetchInfo.url, {
						headers: {
							Range: `bytes=${fetchInfo.url_range.start}-${fetchInfo.url_range.end}`,
						},
					});
				}

				if (!resp.ok) {
					throw await createApiError(resp);
				}

				const reader = resp.body?.getReader();
				if (!reader) {
					throw new Error("Failed to get reader from response body");
				}

				let done = false;
				let chunksToSkip = term.range.start - fetchInfo.range.start;
				let chunksToRead = term.range.end - term.range.start;
				let bytesToSkip = 0;

				let leftoverBytes: Uint8Array | undefined = undefined;

				readChunks: while (!done && totalBytesRead < maxBytes) {
					const result = await reader.read();
					done = result.done;
					if (result.value) {
						while (totalBytesRead < maxBytes && chunksToRead) {
							if (bytesToSkip) {
								if (bytesToSkip >= result.value.length) {
									bytesToSkip -= result.value.length;
									continue readChunks;
								}
								result.value = result.value.slice(bytesToSkip);
								bytesToSkip = 0;
							}
							if (leftoverBytes) {
								result.value = new Uint8Array([...leftoverBytes, ...result.value]);
								leftoverBytes = undefined;
							}

							if (result.value.length < 8) {
								// We need 8 bytes to parse the chunk header
								leftoverBytes = result.value;
								continue readChunks;
							}

							const header = new DataView(result.value.buffer, result.value.byteOffset, CHUNK_HEADER_BYTES);
							const chunkHeader: ChunkHeader = {
								version: header.getUint8(0),
								compressed_length: header.getUint8(1) | (header.getUint8(2) << 8) | (header.getUint8(3) << 16),
								compression_scheme: header.getUint8(4),
								uncompressed_length: header.getUint8(5) | (header.getUint8(6) << 8) | (header.getUint8(7) << 16),
							};

							if (chunkHeader.version !== 0) {
								throw new Error(`Unsupported chunk version ${chunkHeader.version}`);
							}

							if (
								chunkHeader.compression_scheme !== CompressionScheme.None &&
								chunkHeader.compression_scheme !== CompressionScheme.LZ4 &&
								chunkHeader.compression_scheme !== CompressionScheme.ByteGroupingLZ4
							) {
								throw new Error(
									`Unsupported compression scheme ${
										compressionSchemeLabels[chunkHeader.compression_scheme] ?? chunkHeader.compression_scheme
									}`
								);
							}

							if (chunksToSkip) {
								chunksToSkip--;
								result.value = result.value.slice(CHUNK_HEADER_BYTES);
								bytesToSkip = chunkHeader.compressed_length;
								continue;
							}

							if (readBytesToSkip >= chunkHeader.uncompressed_length) {
								readBytesToSkip -= chunkHeader.uncompressed_length;
								result.value = result.value.slice(CHUNK_HEADER_BYTES);
								bytesToSkip = chunkHeader.compressed_length;
								chunksToRead--;
								continue;
							}

							if (result.value.length < chunkHeader.compressed_length + CHUNK_HEADER_BYTES) {
								// We need more data to read the full chunk
								leftoverBytes = result.value;
								continue readChunks;
							}

							result.value = result.value.slice(CHUNK_HEADER_BYTES);

							const uncompressed =
								chunkHeader.compression_scheme === CompressionScheme.LZ4
									? lz4_decompress(
											result.value.slice(0, chunkHeader.compressed_length),
											chunkHeader.uncompressed_length
									  )
									: chunkHeader.compression_scheme === CompressionScheme.ByteGroupingLZ4
									  ? bg4_regoup_bytes(
												lz4_decompress(
													result.value.slice(0, chunkHeader.compressed_length),
													chunkHeader.uncompressed_length
												)
									    )
									  : result.value.slice(0, chunkHeader.compressed_length);

							let bytesToYield: Uint8Array;
							if (readBytesToSkip) {
								const remainingBytes = Math.min(uncompressed.length - readBytesToSkip, maxBytes - totalBytesRead);
								bytesToYield = uncompressed.slice(readBytesToSkip, readBytesToSkip + remainingBytes);
								readBytesToSkip = 0;
							} else {
								bytesToYield = uncompressed.slice(0, Math.min(uncompressed.length, maxBytes - totalBytesRead));
							}

							totalBytesRead += bytesToYield.length;
							yield bytesToYield;
							chunksToRead--;

							result.value = result.value.slice(chunkHeader.compressed_length);
						}
					}
				}

				// Release the reader
				await reader.cancel();
			}
		}

		if (!this.reconstructionInfo) {
			throw new Error("Failed to load reconstruction info");
		}

		const iterator = readData(
			this.reconstructionInfo,
			this.fetch,
			this.end - this.start,
			this.#loadReconstructionInfo.bind(this)
		);

		// todo: when Chrome/Safari support it, use ReadableStream.from(readData)
		return new ReadableStream<Uint8Array>(
			{
				// todo: when Safari supports it, type controller as ReadableByteStreamController
				async pull(controller) {
					const result = await iterator.next();

					if (result.value) {
						controller.enqueue(result.value);
					}

					if (result.done) {
						controller.close();
					}
				},
				type: "bytes",
				// todo: when Safari supports it, add autoAllocateChunkSize param
			},
			// todo : use ByteLengthQueuingStrategy when there's good support for it, currently in Node.js it fails due to size being a function
			{
				highWaterMark: 1_000, // 1_000 chunks for ~1MB of RAM
			}
		);
	}

	override async arrayBuffer(): Promise<ArrayBuffer> {
		const result = await this.#fetch();

		return new Response(result).arrayBuffer();
	}

	override async text(): Promise<string> {
		const result = await this.#fetch();

		return new Response(result).text();
	}

	async response(): Promise<Response> {
		const result = await this.#fetch();

		return new Response(result);
	}

	override stream(): ReturnType<Blob["stream"]> {
		const stream = new TransformStream();

		this.#fetch()
			.then((response) => response.pipeThrough(stream))
			.catch((error) => stream.writable.abort(error.message));

		return stream.readable;
	}
}

const jwtPromises: Map<string, Promise<{ accessToken: string; casUrl: string }>> = new Map();
/**
 * Cache to store JWTs, to avoid making many auth requests when downloading multiple files from the same repo
 */
const jwts: Map<
	string,
	{
		accessToken: string;
		expiresAt: Date;
		casUrl: string;
	}
> = new Map();

function cacheKey(params: { repoId: RepoId; initialAccessToken: string | undefined }): string {
	return `${params.repoId.type}:${params.repoId.name}:${params.initialAccessToken}`;
}

// exported for testing purposes
export function bg4_regoup_bytes(bytes: Uint8Array): Uint8Array {
	// python code

	// split = len(x) // 4
	// rem = len(x) % 4
	// g1_pos = split + (1 if rem >= 1 else 0)
	// g2_pos = g1_pos + split + (1 if rem >= 2 else 0)
	// g3_pos = g2_pos + split + (1 if rem == 3 else 0)
	// ret = bytearray(len(x))
	// ret[0::4] = x[:g1_pos]
	// ret[1::4] = x[g1_pos:g2_pos]
	// ret[2::4] = x[g2_pos:g3_pos]
	// ret[3::4] = x[g3_pos:]

	// todo: optimize to do it in-place

	const split = Math.floor(bytes.length / 4);
	const rem = bytes.length % 4;
	const g1_pos = split + (rem >= 1 ? 1 : 0);
	const g2_pos = g1_pos + split + (rem >= 2 ? 1 : 0);
	const g3_pos = g2_pos + split + (rem == 3 ? 1 : 0);

	const ret = new Uint8Array(bytes.length);
	for (let i = 0, j = 0; i < bytes.length; i += 4, j++) {
		ret[i] = bytes[j];
	}

	for (let i = 1, j = g1_pos; i < bytes.length; i += 4, j++) {
		ret[i] = bytes[j];
	}

	for (let i = 2, j = g2_pos; i < bytes.length; i += 4, j++) {
		ret[i] = bytes[j];
	}

	for (let i = 3, j = g3_pos; i < bytes.length; i += 4, j++) {
		ret[i] = bytes[j];
	}

	return ret;

	// alternative implementation (to benchmark which one is faster)
	// for (let i = 0; i < bytes.length - 3; i += 4) {
	// 	ret[i] = bytes[i / 4];
	// 	ret[i + 1] = bytes[g1_pos + i / 4];
	// 	ret[i + 2] = bytes[g2_pos + i / 4];
	// 	ret[i + 3] = bytes[g3_pos + i / 4];
	// }

	// if (rem === 1) {
	// 	ret[bytes.length - 1] = bytes[g1_pos - 1];
	// } else if (rem === 2) {
	// 	ret[bytes.length - 2] = bytes[g1_pos - 1];
	// 	ret[bytes.length - 1] = bytes[g2_pos - 1];
	// } else if (rem === 3) {
	// 	ret[bytes.length - 3] = bytes[g1_pos - 1];
	// 	ret[bytes.length - 2] = bytes[g2_pos - 1];
	// 	ret[bytes.length - 1] = bytes[g3_pos - 1];
	// }
}

async function getAccessToken(
	repoId: RepoId,
	initialAccessToken: string | undefined,
	customFetch: typeof fetch,
	hubUrl: string
): Promise<{ accessToken: string; casUrl: string }> {
	const key = cacheKey({ repoId, initialAccessToken });

	const jwt = jwts.get(key);

	if (jwt && jwt.expiresAt > new Date(Date.now() + JWT_SAFETY_PERIOD)) {
		return { accessToken: jwt.accessToken, casUrl: jwt.casUrl };
	}

	// If we already have a promise for this repo, return it
	const existingPromise = jwtPromises.get(key);
	if (existingPromise) {
		return existingPromise;
	}

	const promise = (async () => {
		const url = `${hubUrl}/api/${repoId.type}s/${repoId.name}/xet-read-token/main`;
		const resp = await customFetch(url, {
			headers: {
				...(initialAccessToken
					? {
							Authorization: `Bearer ${initialAccessToken}`,
					  }
					: {}),
			},
		});

		if (!resp.ok) {
			throw new Error(`Failed to get JWT token: ${resp.status} ${await resp.text()}`);
		}

		const json: { accessToken: string; casUrl: string; exp: number } = await resp.json();
		const jwt = {
			repoId,
			accessToken: json.accessToken,
			expiresAt: new Date(json.exp * 1000),
			initialAccessToken,
			hubUrl,
			casUrl: json.casUrl,
		};

		jwtPromises.delete(key);

		for (const [key, value] of jwts.entries()) {
			if (value.expiresAt < new Date(Date.now() + JWT_SAFETY_PERIOD)) {
				jwts.delete(key);
			} else {
				break;
			}
		}
		if (jwts.size >= JWT_CACHE_SIZE) {
			const keyToDelete = jwts.keys().next().value;
			if (keyToDelete) {
				jwts.delete(keyToDelete);
			}
		}
		jwts.set(key, jwt);

		return {
			accessToken: json.accessToken,
			casUrl: json.casUrl,
		};
	})();

	jwtPromises.set(repoId.name, promise);

	return promise;
}
