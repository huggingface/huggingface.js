import { createApiError } from "../error";
import type { CredentialsParams } from "../types/public";
import { checkCredentials } from "./checkCredentials";
import { combineUint8Arrays } from "./combineUint8Arrays";
import { decompress as lz4_decompress } from "../vendor/lz4js";
import { RangeList } from "./RangeList";
import { StreamingMultipartParser } from "./multipart";

const JWT_SAFETY_PERIOD = 60_000;
const JWT_CACHE_SIZE = 1_000;

export interface XetReadToken {
	accessToken: string;
	casUrl: string;
	exp: number;
}

type XetBlobCreateOptions = {
	/**
	 * Custom fetch function to use instead of the default one, for example to use a proxy or edit headers.
	 */
	fetch?: typeof fetch;
	// URL to get the access token from
	refreshUrl: string;
	size: number;
	listener?: (arg: { event: "read" } | { event: "progress"; progress: { read: number; total: number } }) => void;
	internalLogging?: boolean;
	/**
	 * Pre-fetched read token to avoid the refresh URL roundtrip.
	 */
	readToken?: XetReadToken;
} & ({ hash: string; reconstructionUrl?: string } | { hash?: string; reconstructionUrl: string }) &
	Partial<CredentialsParams>;

/**
 * Response shape of `GET /v2/reconstructions/{hash}`, see https://huggingface.co/docs/xet/en/download-protocol
 *
 * Unlike the (deprecated) V1 endpoint, a signed URL carries all the byte ranges needed from a xorb,
 * signed together in the URL's `X-Xet-Signed-Range` query param. Requesting bytes outside that set
 * fails authorization, which prevents a leaked URL from exposing arbitrary parts of the xorb.
 */
export interface ReconstructionInfo {
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
	 * Dictionnary of CAS block hash => list of fetch entries for the block.
	 *
	 * Typically one entry per xorb; multiple entries only when the signed URL would exceed the URL
	 * length limit.
	 */
	xorbs: Record<
		string,
		Array<{
			/**
			 * Signed URL covering all of `ranges`. The `Range` header sent to it must be built from
			 * the `bytes` ranges below; requesting other bytes fails authorization.
			 */
			url: string;
			/** Fragmented ranges, ordered by ascending `chunks.start` */
			ranges: Array<{
				/** Chunk index range within the xorb, end-exclusive: [start, end) */
				chunks: { start: number; end: number };
				/** Physical byte range for the HTTP Range header, end-inclusive: [start, end] */
				bytes: { start: number; end: number };
			}>;
		}>
	>;
	/**
	 * When doing a range request, the offset into the term's uncompressed data. Can be multiple chunks' worth of data.
	 */
	offset_into_first_range: number;
}

type XorbFetchEntry = ReconstructionInfo["xorbs"][string][number];
type XorbRangeDescriptor = XorbFetchEntry["ranges"][number];

export enum XetChunkCompressionScheme {
	None = 0,
	LZ4 = 1,
	ByteGroupingLZ4 = 2,
}

const compressionSchemeLabels: Record<XetChunkCompressionScheme, string> = {
	[XetChunkCompressionScheme.None]: "None",
	[XetChunkCompressionScheme.LZ4]: "LZ4",
	[XetChunkCompressionScheme.ByteGroupingLZ4]: "ByteGroupingLZ4",
};

interface ChunkHeader {
	version: number; // u8, 1 byte
	compressed_length: number; // 3 * u8, 3 bytes
	compression_scheme: XetChunkCompressionScheme; // u8, 1 byte
	uncompressed_length: number; // 3 * u8, 3 bytes
}

export const XET_CHUNK_HEADER_BYTES = 8;

function parseChunkHeader(view: DataView): ChunkHeader {
	const chunkHeader: ChunkHeader = {
		version: view.getUint8(0),
		compressed_length: view.getUint8(1) | (view.getUint8(2) << 8) | (view.getUint8(3) << 16),
		compression_scheme: view.getUint8(4),
		uncompressed_length: view.getUint8(5) | (view.getUint8(6) << 8) | (view.getUint8(7) << 16),
	};

	if (chunkHeader.version !== 0) {
		throw new Error(`Unsupported chunk version ${chunkHeader.version}`);
	}

	if (
		chunkHeader.compression_scheme !== XetChunkCompressionScheme.None &&
		chunkHeader.compression_scheme !== XetChunkCompressionScheme.LZ4 &&
		chunkHeader.compression_scheme !== XetChunkCompressionScheme.ByteGroupingLZ4
	) {
		throw new Error(
			`Unsupported compression scheme ${
				compressionSchemeLabels[chunkHeader.compression_scheme] ?? chunkHeader.compression_scheme
			}`,
		);
	}

	return chunkHeader;
}

function decompressChunk(chunkHeader: ChunkHeader, compressed: Uint8Array): Uint8Array {
	switch (chunkHeader.compression_scheme) {
		case XetChunkCompressionScheme.LZ4:
			return lz4_decompress(compressed, chunkHeader.uncompressed_length);
		case XetChunkCompressionScheme.ByteGroupingLZ4:
			return bg4_regroup_bytes(lz4_decompress(compressed, chunkHeader.uncompressed_length));
		default:
			// Copy so we don't retain the (possibly much larger) source buffer
			return compressed.slice();
	}
}

type StagedChunks = Map<{ data: Uint8Array[] | null }, Uint8Array[]>;

/**
 * Decode one complete xorb chunk stream (a single `multipart/byteranges` part) into per-range
 * staged chunk arrays. Throws if it doesn't decode to exactly the chunks the descriptor covers,
 * so a truncated/corrupt part never leaves partial data to be committed to the cache.
 */
function decodePartChunks(
	data: Uint8Array,
	descriptor: XorbRangeDescriptor,
	rangeList: RangeList<Uint8Array[]>,
): StagedChunks {
	const ranges = rangeList.getRanges(descriptor.chunks.start, descriptor.chunks.end);
	const staged: StagedChunks = new Map();
	let chunkIndex = descriptor.chunks.start;
	let offset = 0;

	while (offset < data.byteLength) {
		if (chunkIndex >= descriptor.chunks.end) {
			throw new Error(
				`Multipart part for chunks ${descriptor.chunks.start}-${descriptor.chunks.end} contains more chunks than expected`,
			);
		}
		if (data.byteLength - offset < XET_CHUNK_HEADER_BYTES) {
			throw new Error("Truncated chunk header in multipart part");
		}

		const chunkHeader = parseChunkHeader(new DataView(data.buffer, data.byteOffset + offset, XET_CHUNK_HEADER_BYTES));
		const compressedStart = offset + XET_CHUNK_HEADER_BYTES;
		const compressedEnd = compressedStart + chunkHeader.compressed_length;

		if (compressedEnd > data.byteLength) {
			throw new Error("Truncated chunk data in multipart part");
		}

		const uncompressed = decompressChunk(chunkHeader, data.subarray(compressedStart, compressedEnd));

		const range = ranges.find((range) => chunkIndex >= range.start && chunkIndex < range.end);
		if (range) {
			let chunks = staged.get(range);
			if (!chunks) {
				chunks = [];
				staged.set(range, chunks);
			}
			chunks.push(uncompressed);
		}

		chunkIndex++;
		offset = compressedEnd;
	}

	if (chunkIndex !== descriptor.chunks.end) {
		throw new Error(
			`Multipart part decoded chunks ${descriptor.chunks.start}-${chunkIndex} but expected ${descriptor.chunks.start}-${descriptor.chunks.end}`,
		);
	}

	return staged;
}

function commitChunks(staged: StagedChunks): void {
	for (const [range, chunks] of staged) {
		range.data = chunks;
	}
}

/**
 * XetBlob is a blob implementation that fetches data directly from the Xet storage
 */
export class XetBlob extends Blob {
	fetch: typeof fetch;
	accessToken?: string;
	refreshUrl: string;
	reconstructionUrl?: string;
	hash?: string;
	start = 0;
	end = 0;
	internalLogging = false;
	reconstructionInfo: ReconstructionInfo | undefined;
	listener: XetBlobCreateOptions["listener"];

	constructor(params: XetBlobCreateOptions) {
		super([]);

		this.fetch = params.fetch ?? fetch.bind(globalThis);
		this.accessToken = checkCredentials(params);
		this.refreshUrl = params.refreshUrl;
		this.end = params.size;
		this.reconstructionUrl = params.reconstructionUrl;
		this.hash = params.hash;
		this.listener = params.listener;
		this.internalLogging = params.internalLogging ?? false;

		if (params.readToken) {
			const key = cacheKey({ refreshUrl: this.refreshUrl, initialAccessToken: this.accessToken });
			jwts.set(key, {
				accessToken: params.readToken.accessToken,
				expiresAt: new Date(params.readToken.exp * 1000),
				casUrl: params.readToken.casUrl,
			});
		}
	}

	override get size(): number {
		return this.end - this.start;
	}

	#clone() {
		const blob = new XetBlob({
			fetch: this.fetch,
			hash: this.hash,
			refreshUrl: this.refreshUrl,
			// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
			reconstructionUrl: this.reconstructionUrl!,
			size: this.size,
		});

		blob.accessToken = this.accessToken;
		blob.start = this.start;
		blob.end = this.end;
		blob.reconstructionInfo = this.reconstructionInfo;
		blob.listener = this.listener;
		blob.internalLogging = this.internalLogging;

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
			const connParams = await getAccessToken(this.accessToken, this.fetch, this.refreshUrl);

			// The `xet-reconstruction-info` Link header from the Hub points to the deprecated V1
			// endpoint; derive the V2 URL from it.
			const url = this.reconstructionUrl
				? this.reconstructionUrl.replace("/v1/reconstructions/", "/v2/reconstructions/")
				: `${connParams.casUrl}/v2/reconstructions/${this.hash}`;

			// debug(`curl '${url}' -H 'Authorization: Bearer ${connParams.accessToken}'`);

			const resp = await this.fetch(url, {
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
		if (this.size === 0) {
			return new ReadableStream<Uint8Array>({
				start(controller) {
					controller.close();
				},
			});
		}

		if (!this.reconstructionInfo) {
			await this.#loadReconstructionInfo();
		}

		const rangeLists = new Map<string, RangeList<Uint8Array[]>>();

		if (!this.reconstructionInfo) {
			throw new Error("Failed to load reconstruction info");
		}

		for (const term of this.reconstructionInfo.terms) {
			let rangeList = rangeLists.get(term.hash);
			if (!rangeList) {
				rangeList = new RangeList<Uint8Array[]>();
				rangeLists.set(term.hash, rangeList);
			}

			rangeList.add(term.range.start, term.range.end);
		}
		const listener = this.listener;
		const log = this.internalLogging ? (...args: unknown[]) => console.log(...args) : () => {};

		async function* readData(
			reconstructionInfo: ReconstructionInfo,
			customFetch: typeof fetch,
			maxBytes: number,
			reloadReconstructionInfo: () => Promise<ReconstructionInfo>,
		) {
			let totalBytesRead = 0;
			let readBytesToSkip = reconstructionInfo.offset_into_first_range;

			for (const term of reconstructionInfo.terms) {
				if (totalBytesRead >= maxBytes) {
					break;
				}

				const rangeList = rangeLists.get(term.hash);
				if (!rangeList) {
					throw new Error(`Failed to find range list for term ${term.hash}`);
				}

				// Locate the fetch entry + range descriptor whose chunk range covers this term
				const locate = (info: ReconstructionInfo) => {
					for (const entry of info.xorbs[term.hash] ?? []) {
						const descriptor = entry.ranges.find(
							(r) => r.chunks.start <= term.range.start && r.chunks.end >= term.range.end,
						);
						if (descriptor) {
							return { entry, descriptor };
						}
					}
					return undefined;
				};

				const buildMultiRangeHeader = (entry: XorbFetchEntry) =>
					`bytes=${entry.ranges.map((r) => `${r.bytes.start}-${r.bytes.end}`).join(",")}`;

				// Fetch all signed ranges of a multi-range entry in a single request, and store the
				// decoded chunks into the cache. The reconstruction server is expected to only emit
				// multi-range URLs when its CDN supports them; servers without multi-range support get
				// one fetch entry per range instead (single-range streaming path below).
				const fetchMultiRangeEntry = async (entry: XorbFetchEntry): Promise<void> => {
					let resp = await customFetch(entry.url, { headers: { Range: buildMultiRangeHeader(entry) } });

					if (resp.status === 403) {
						// In case it's expired
						reconstructionInfo = await reloadReconstructionInfo();
						const relocated = locate(reconstructionInfo);
						if (!relocated) {
							throw new Error(
								`Failed to find fetch info for term ${term.hash} and range ${term.range.start}-${term.range.end} after refresh`,
							);
						}
						entry = relocated.entry;
						resp = await customFetch(entry.url, { headers: { Range: buildMultiRangeHeader(entry) } });
					}

					if (!resp.ok) {
						throw await createApiError(resp);
					}

					const contentType = resp.headers.get("content-type") ?? "";
					if (!contentType.includes("multipart/byteranges")) {
						// The server ignored (or coalesced) the multi-range request, so the body can't be
						// mapped back to the signed ranges; decoding it heuristically would risk corruption.
						throw new Error(`Expected multipart/byteranges response for multi-range request, got "${contentType}"`);
					}

					const reader = resp.body?.getReader();
					if (!reader) {
						throw new Error("Failed to get reader from response body");
					}

					// Stream the body: decode each part as it completes and stage its chunks, so memory
					// stays bounded by the largest part instead of the whole xorb. Parts arrive in the
					// same ascending order as the entry's ranges.
					const parser = new StreamingMultipartParser(contentType);
					const stagedParts: StagedChunks[] = [];
					let partIndex = 0;

					const consumeParts = (parts: Uint8Array[]) => {
						for (const part of parts) {
							const descriptor = entry.ranges[partIndex];
							if (!descriptor) {
								throw new Error(`Received more multipart parts than the ${entry.ranges.length} signed ranges`);
							}
							stagedParts.push(decodePartChunks(part, descriptor, rangeList));
							partIndex++;
						}
					};

					try {
						for (;;) {
							const result = await reader.read();
							listener?.({ event: "read" });
							if (result.done) {
								break;
							}
							if (result.value) {
								consumeParts(parser.push(result.value));
							}
						}
						consumeParts(parser.push());
					} finally {
						await reader.cancel().catch(() => {});
					}

					if (partIndex !== entry.ranges.length) {
						throw new Error(
							`Multi-range fetch produced ${partIndex} parts but expected ${entry.ranges.length} for term ${term.hash}`,
						);
					}

					// All parts decoded cleanly and cover every signed range: commit to the cache.
					for (const staged of stagedParts) {
						commitChunks(staged);
					}
				};

				let termRanges = rangeList.getRanges(term.range.start, term.range.end);

				if (!termRanges.every((range) => range.data)) {
					const located = locate(reconstructionInfo);
					if (!located) {
						throw new Error(
							`Failed to find fetch info for term ${term.hash} and range ${term.range.start}-${term.range.end}`,
						);
					}
					if (located.entry.ranges.length > 1) {
						await fetchMultiRangeEntry(located.entry);
						termRanges = rangeList.getRanges(term.range.start, term.range.end);
					}
				}

				{
					if (termRanges.every((range) => range.data)) {
						log("all data available for term", term.hash, readBytesToSkip);

						const cachedLength = termRanges.reduce(
							// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
							(sum, range) => sum + range.data!.reduce((acc, chunk) => acc + chunk.byteLength, 0),
							0,
						);
						if (cachedLength !== term.unpacked_length) {
							throw new Error(
								`Term ${term.hash} range ${term.range.start}-${term.range.end} decoded to ${cachedLength} bytes, expected ${term.unpacked_length}`,
							);
						}

						rangeLoop: for (const range of termRanges) {
							// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
							for (let chunk of range.data!) {
								if (readBytesToSkip) {
									const skipped = Math.min(readBytesToSkip, chunk.byteLength);
									chunk = chunk.slice(skipped);
									readBytesToSkip -= skipped;
									if (!chunk.byteLength) {
										continue;
									}
								}
								if (chunk.byteLength > maxBytes - totalBytesRead) {
									chunk = chunk.slice(0, maxBytes - totalBytesRead);
								}
								totalBytesRead += chunk.byteLength;
								// The stream consumer can decide to transfer ownership of the chunk, so we need to return a clone
								// if there's more than one range for the same term
								yield range.refCount > 1 ? chunk.slice() : chunk;
								listener?.({ event: "progress", progress: { read: totalBytesRead, total: maxBytes } });

								if (totalBytesRead >= maxBytes) {
									break rangeLoop;
								}
							}
						}
						rangeList.remove(term.range.start, term.range.end);
						continue;
					}
				}

				// Stream a single range: fetch the descriptor covering this term with a single-range
				// header. Each individual range is part of the URL's signed range set, so this stays
				// authorized even when the multi-range request isn't supported by the server.
				let located = locate(reconstructionInfo);

				if (!located) {
					throw new Error(
						`Failed to find fetch info for term ${term.hash} and range ${term.range.start}-${term.range.end}`,
					);
				}
				let descriptor = located.descriptor;

				log("term", term);
				log("descriptor", descriptor);
				log("readBytesToSkip", readBytesToSkip);

				let resp = await customFetch(located.entry.url, {
					headers: {
						Range: `bytes=${descriptor.bytes.start}-${descriptor.bytes.end}`,
					},
				});

				if (resp.status === 403) {
					// In case it's expired
					reconstructionInfo = await reloadReconstructionInfo();
					located = locate(reconstructionInfo);
					if (!located) {
						throw new Error(
							`Failed to find fetch info for term ${term.hash} and range ${term.range.start}-${term.range.end} after refresh`,
						);
					}
					descriptor = located.descriptor;
					resp = await customFetch(located.entry.url, {
						headers: {
							Range: `bytes=${descriptor.bytes.start}-${descriptor.bytes.end}`,
						},
					});
				}

				if (!resp.ok) {
					throw await createApiError(resp);
				}

				log(
					"expected content length",
					resp.headers.get("content-length"),
					"range",
					descriptor.bytes,
					resp.headers.get("content-range"),
				);

				const reader = resp.body?.getReader();
				if (!reader) {
					throw new Error("Failed to get reader from response body");
				}

				let done = false;
				let chunkIndex = descriptor.chunks.start;
				const ranges = rangeList.getRanges(descriptor.chunks.start, descriptor.chunks.end);

				let leftoverBytes: Uint8Array | undefined = undefined;
				let totalFetchBytes = 0;

				fetchData: while (!done && totalBytesRead < maxBytes) {
					const result = await reader.read();
					listener?.({ event: "read" });

					done = result.done;

					log("read", result.value?.byteLength, "bytes", "total read", totalBytesRead, "toSkip", readBytesToSkip);

					if (!result.value) {
						log("no data in result, cancelled", result);
						continue;
					}

					totalFetchBytes += result.value.byteLength;

					if (leftoverBytes) {
						result.value = combineUint8Arrays(leftoverBytes, result.value);
						leftoverBytes = undefined;
					}

					while (totalBytesRead < maxBytes && result.value?.byteLength) {
						if (result.value.byteLength < 8) {
							// We need 8 bytes to parse the chunk header
							leftoverBytes = result.value;
							continue fetchData;
						}

						const header = new DataView(result.value.buffer, result.value.byteOffset, XET_CHUNK_HEADER_BYTES);
						const chunkHeader = parseChunkHeader(header);

						log("chunk header", chunkHeader, "to skip", readBytesToSkip);

						if (result.value.byteLength < chunkHeader.compressed_length + XET_CHUNK_HEADER_BYTES) {
							// We need more data to read the full chunk
							leftoverBytes = result.value;
							continue fetchData;
						}

						result.value = result.value.slice(XET_CHUNK_HEADER_BYTES);

						let uncompressed = decompressChunk(chunkHeader, result.value.subarray(0, chunkHeader.compressed_length));

						const range = ranges.find((range) => chunkIndex >= range.start && chunkIndex < range.end);
						const shouldYield = chunkIndex >= term.range.start && chunkIndex < term.range.end;
						const minRefCountToStore = shouldYield ? 2 : 1;
						let stored = false;

						// Assuming non-overlapping fetch ranges for the same hash
						if (range && range.refCount >= minRefCountToStore) {
							range.data ??= [];
							range.data.push(uncompressed);
							stored = true;
						}

						if (shouldYield) {
							if (readBytesToSkip) {
								const skipped = Math.min(readBytesToSkip, uncompressed.byteLength);
								uncompressed = uncompressed.slice(readBytesToSkip);
								readBytesToSkip -= skipped;
							}

							if (uncompressed.byteLength > maxBytes - totalBytesRead) {
								uncompressed = uncompressed.slice(0, maxBytes - totalBytesRead);
							}

							if (uncompressed.byteLength) {
								log(
									"yield",
									uncompressed.byteLength,
									"bytes",
									result.value.byteLength,
									"total read",
									totalBytesRead,
									stored,
								);
								totalBytesRead += uncompressed.byteLength;
								yield stored ? uncompressed.slice() : uncompressed;
								listener?.({ event: "progress", progress: { read: totalBytesRead, total: maxBytes } });
							}
						}

						chunkIndex++;
						result.value = result.value.slice(chunkHeader.compressed_length);
					}
				}

				if (done && totalBytesRead < maxBytes && totalFetchBytes < descriptor.bytes.end - descriptor.bytes.start + 1) {
					log("done", done, "total read", totalBytesRead, maxBytes, totalFetchBytes);
					log("failed to fetch all data for term", term.hash);
					throw new Error(
						`Failed to fetch all data for term ${term.hash}, fetched ${totalFetchBytes} bytes out of ${
							descriptor.bytes.end - descriptor.bytes.start + 1
						}`,
					);
				}

				log("done", done, "total read", totalBytesRead, maxBytes, totalFetchBytes);

				// Release the reader
				log("cancel reader");
				await reader.cancel();
			}
		}

		const iterator = readData(
			this.reconstructionInfo,
			this.fetch,
			this.end - this.start,
			this.#loadReconstructionInfo.bind(this),
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
			},
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

function cacheKey(params: { refreshUrl: string; initialAccessToken: string | undefined }): string {
	return JSON.stringify([params.refreshUrl, params.initialAccessToken]);
}

// exported for testing purposes
export function bg4_regroup_bytes(bytes: Uint8Array): Uint8Array {
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

	const split = Math.floor(bytes.byteLength / 4);
	const rem = bytes.byteLength % 4;
	const g1_pos = split + (rem >= 1 ? 1 : 0);
	const g2_pos = g1_pos + split + (rem >= 2 ? 1 : 0);
	const g3_pos = g2_pos + split + (rem == 3 ? 1 : 0);

	const ret = new Uint8Array(bytes.byteLength);
	for (let i = 0, j = 0; i < bytes.byteLength; i += 4, j++) {
		ret[i] = bytes[j];
	}

	for (let i = 1, j = g1_pos; i < bytes.byteLength; i += 4, j++) {
		ret[i] = bytes[j];
	}

	for (let i = 2, j = g2_pos; i < bytes.byteLength; i += 4, j++) {
		ret[i] = bytes[j];
	}

	for (let i = 3, j = g3_pos; i < bytes.byteLength; i += 4, j++) {
		ret[i] = bytes[j];
	}

	return ret;

	// alternative implementation (to benchmark which one is faster)
	// for (let i = 0; i < bytes.byteLength - 3; i += 4) {
	// 	ret[i] = bytes[i / 4];
	// 	ret[i + 1] = bytes[g1_pos + i / 4];
	// 	ret[i + 2] = bytes[g2_pos + i / 4];
	// 	ret[i + 3] = bytes[g3_pos + i / 4];
	// }

	// if (rem === 1) {
	// 	ret[bytes.byteLength - 1] = bytes[g1_pos - 1];
	// } else if (rem === 2) {
	// 	ret[bytes.byteLength - 2] = bytes[g1_pos - 1];
	// 	ret[bytes.byteLength - 1] = bytes[g2_pos - 1];
	// } else if (rem === 3) {
	// 	ret[bytes.byteLength - 3] = bytes[g1_pos - 1];
	// 	ret[bytes.byteLength - 2] = bytes[g2_pos - 1];
	// 	ret[bytes.byteLength - 1] = bytes[g3_pos - 1];
	// }
}

export function bg4_split_bytes(bytes: Uint8Array): Uint8Array {
	// This function does the opposite of bg4_regroup_bytes
	// It takes interleaved bytes and groups them by 4

	const ret = new Uint8Array(bytes.byteLength);
	const split = Math.floor(bytes.byteLength / 4);
	const rem = bytes.byteLength % 4;

	// Calculate group positions in the output array
	const g1_pos = split + (rem >= 1 ? 1 : 0);
	const g2_pos = g1_pos + split + (rem >= 2 ? 1 : 0);
	const g3_pos = g2_pos + split + (rem == 3 ? 1 : 0);

	// Extract every 4th byte starting from position 0, 1, 2, 3
	// and place them in their respective groups
	for (let i = 0, j = 0; i < bytes.byteLength; i += 4, j++) {
		ret[j] = bytes[i];
	}

	for (let i = 1, j = g1_pos; i < bytes.byteLength; i += 4, j++) {
		ret[j] = bytes[i];
	}

	for (let i = 2, j = g2_pos; i < bytes.byteLength; i += 4, j++) {
		ret[j] = bytes[i];
	}

	for (let i = 3, j = g3_pos; i < bytes.byteLength; i += 4, j++) {
		ret[j] = bytes[i];
	}

	return ret;
}

async function getAccessToken(
	initialAccessToken: string | undefined,
	customFetch: typeof fetch,
	refreshUrl: string,
): Promise<{ accessToken: string; casUrl: string }> {
	const key = cacheKey({ refreshUrl, initialAccessToken });

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
		const resp = await customFetch(refreshUrl, {
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
			accessToken: json.accessToken,
			expiresAt: new Date(json.exp * 1000),
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

	jwtPromises.set(key, promise);

	return promise;
}
