import { createApiError } from "../error";
import type { CredentialsParams } from "../types/public";
import { checkCredentials } from "./checkCredentials";
import { combineUint8Arrays } from "./combineUint8Arrays";
import { decompress as lz4_decompress } from "../vendor/lz4js";
import { RangeList } from "./RangeList";
import { StreamingMultipartParser } from "./multipart";
import { sum } from "./sum";
import { concatUint8Arrays } from "./concatUint8Arrays";

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
	/**
	 * Fetch xorb data with multiple parallel requests, instead of one at a time.
	 *
	 * Concurrency is tuned automatically (starting at 2, between 1 and `maxConcurrency`),
	 * increasing while aggregate throughput improves and backing off on rate-limits or when
	 * extra connections stop helping. Memory is bounded: at most `maxInFlightBytes` of
	 * downloaded-but-not-yet-consumed data is held (by default derived from the file's
	 * reconstruction, between 64MB and 256MB).
	 *
	 * @default false
	 */
	parallelDownloads?: boolean | ParallelDownloadOptions;
} & ({ hash: string; reconstructionUrl?: string } | { hash?: string; reconstructionUrl: string }) &
	Partial<CredentialsParams>;

export interface ParallelDownloadOptions {
	/** Ceiling for the auto-tuned number of concurrent xorb requests. @default 8 */
	maxConcurrency?: number;
	/**
	 * Budget of downloaded-but-not-yet-consumed bytes.
	 *
	 * @default derived from the file's reconstruction: 3x the largest xorb fetch, clamped to [64MB, 256MB]
	 */
	maxInFlightBytes?: number;
	/**
	 * @internal Instrumentation callback for tests and benchmarks, called once per download.
	 */
	onStat?: (stat: Record<string, unknown>) => void;
}

const PARALLEL_DEFAULT_MAX_CONCURRENCY = 8;
const PARALLEL_MIN_IN_FLIGHT_BYTES = 64 * 1024 * 1024;
const PARALLEL_MAX_IN_FLIGHT_BYTES = 256 * 1024 * 1024;

/** Simple broadcast notifier: `wait()` resolves at the next `notifyAll()`. */
class Notifier {
	#resolvers: Array<() => void> = [];
	wait(): Promise<void> {
		return new Promise((resolve) => this.#resolvers.push(resolve));
	}
	notifyAll(): void {
		const resolvers = this.#resolvers;
		this.#resolvers = [];
		for (const resolve of resolvers) {
			resolve();
		}
	}
}

function delay(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

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

/**
 * Commit staged chunks to their ranges and return the number of bytes committed.
 *
 * Ranges that already have data (eg from a previous attempt of a retried fetch) are skipped, so
 * re-decoding an entry never commits — or counts — the same range twice.
 */
function commitChunks(staged: StagedChunks): number {
	let committed = 0;
	for (const [range, chunks] of staged) {
		if (range.data) {
			continue;
		}
		range.data = chunks;
		committed += sum(chunks.map((chunk) => chunk.byteLength));
	}
	return committed;
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
	parallelDownloads?: boolean | ParallelDownloadOptions;

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
		this.parallelDownloads = params.parallelDownloads;

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
		blob.parallelDownloads = this.parallelDownloads;

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

						// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
						const cachedLength = sum(termRanges.map((range) => sum(range.data!.map((chunk) => chunk.byteLength))));
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

		// EXPERIMENT: parallel scheduler. Fetches xorb entries with N workers, decodes into the
		// rangeList cache under a decoded-bytes budget, and yields terms in order from the cache.
		const parallelOptions =
			this.parallelDownloads === true
				? {}
				: this.parallelDownloads === false || this.parallelDownloads === undefined
					? undefined
					: this.parallelDownloads;
		async function* readDataParallel(
			reconstructionInfo: ReconstructionInfo,
			customFetch: typeof fetch,
			maxBytes: number,
			reloadReconstructionInfo: () => Promise<ReconstructionInfo>,
			opts: ParallelDownloadOptions,
		) {
			let totalBytesRead = 0;
			let readBytesToSkip = reconstructionInfo.offset_into_first_range;
			const terms = reconstructionInfo.terms;

			// ---- Plan: unique fetch entries, ordered by first term that needs them
			interface PlanItem {
				hash: string;
				ranges: XorbFetchEntry["ranges"];
				url: string;
			}
			const locateEntryFor = (info: ReconstructionInfo, term: (typeof terms)[number]) => {
				for (const entry of info.xorbs[term.hash] ?? []) {
					const descriptor = entry.ranges.find(
						(r) => r.chunks.start <= term.range.start && r.chunks.end >= term.range.end,
					);
					if (descriptor) {
						return entry;
					}
				}
				return undefined;
			};
			const plan: PlanItem[] = [];
			const planIndexByUrl = new Map<string, number>();
			const termEntryIndex: number[] = [];
			for (const term of terms) {
				const entry = locateEntryFor(reconstructionInfo, term);
				if (!entry) {
					throw new Error(
						`Failed to find fetch info for term ${term.hash} and range ${term.range.start}-${term.range.end}`,
					);
				}
				let idx = planIndexByUrl.get(entry.url);
				if (idx === undefined) {
					idx = plan.length;
					plan.push({ hash: term.hash, ranges: entry.ranges, url: entry.url });
					planIndexByUrl.set(entry.url, idx);
				}
				termEntryIndex.push(idx);
			}

			const maxConcurrency = Math.max(1, opts.maxConcurrency ?? PARALLEL_DEFAULT_MAX_CONCURRENCY);
			const estimateEntryBytes = (item: PlanItem) => sum(item.ranges.map((r) => r.bytes.end - r.bytes.start + 1));
			// Budget for downloaded-but-not-yet-consumed bytes. Derived from the reconstruction so a
			// file with large xorb fetches still gets real parallelism, without an unbounded worst case.
			const largestEntryBytes = plan.length ? Math.max(...plan.map(estimateEntryBytes)) : 0;
			const maxInFlightBytes =
				opts.maxInFlightBytes ??
				Math.min(PARALLEL_MAX_IN_FLIGHT_BYTES, Math.max(PARALLEL_MIN_IN_FLIGHT_BYTES, 3 * largestEntryBytes));

			const state = {
				nextEntry: 0,
				neededEntry: 0,
				target: Math.min(2, maxConcurrency),
				error: undefined as unknown,
				finished: false,
				inFlightBytes: 0,
				decodedBytes: 0,
				active: 0,
				claimed: 0,
				maxActive: 0,
				count429: 0,
				targetHistory: [] as number[],
			};
			const notifier = new Notifier();

			// Budget is reserved BEFORE the fetch starts (estimated from the entry's compressed byte
			// ranges), so streams are always read at full speed once open — a worker stalled on
			// budget mid-stream would get its idle socket closed by the server.
			const budgetAcquire = async (n: number, entryIdx: number) => {
				while (
					!state.error &&
					!state.finished &&
					state.inFlightBytes + n > maxInFlightBytes &&
					entryIdx !== state.neededEntry
				) {
					await notifier.wait();
				}
				state.inFlightBytes += n;
			};
			const budgetRelease = (n: number) => {
				state.inFlightBytes -= n;
				notifier.notifyAll();
			};

			// Signed URLs rotate on auth refresh: re-resolve plan URLs by chunk-range identity.
			const refreshPlanUrls = (info: ReconstructionInfo) => {
				for (const item of plan) {
					const match = (info.xorbs[item.hash] ?? []).find(
						(e) =>
							e.ranges.length === item.ranges.length &&
							e.ranges.every(
								(r, i) => r.chunks.start === item.ranges[i].chunks.start && r.chunks.end === item.ranges[i].chunks.end,
							),
					);
					if (match) {
						item.url = match.url;
						item.ranges = match.ranges;
					}
				}
			};

			const rangeHeaderFor = (item: PlanItem) =>
				`bytes=${item.ranges.map((r) => `${r.bytes.start}-${r.bytes.end}`).join(",")}`;

			// Fetch + decode one entry into the rangeList cache (per-range atomic commits).
			// `tally.committed` counts decoded bytes committed to the cache (for budget accounting).
			// The tally is shared across retry attempts: commits skip already-populated ranges, so
			// each range is counted at most once no matter how often the entry is re-fetched.
			const decodeEntry = async (item: PlanItem, entryIdx: number, tally: { committed: number }): Promise<void> => {
				if (state.error || state.finished) {
					// Cancelled or failed while waiting for budget: don't open a new connection.
					return;
				}
				const rangeList = rangeLists.get(item.hash);
				if (!rangeList) {
					throw new Error(`Failed to find range list for entry ${item.hash}`);
				}

				let resp = await customFetch(item.url, { headers: { Range: rangeHeaderFor(item) } });
				let attempts403 = 0;
				let attempts429 = 0;
				while ((resp.status === 403 && attempts403 < 1) || (resp.status === 429 && attempts429 < 3)) {
					await resp.body?.cancel().catch(() => {});
					if (resp.status === 403) {
						attempts403++;
						reconstructionInfo = await reloadReconstructionInfo();
						refreshPlanUrls(reconstructionInfo);
					} else {
						attempts429++;
						state.count429++;
						notifier.notifyAll();
						await delay(300 * attempts429);
					}
					resp = await customFetch(item.url, { headers: { Range: rangeHeaderFor(item) } });
				}
				if (!resp.ok) {
					throw await createApiError(resp);
				}
				const reader = resp.body?.getReader();
				if (!reader) {
					throw new Error("Failed to get reader from response body");
				}

				try {
					if (item.ranges.length > 1) {
						const contentType = resp.headers.get("content-type") ?? "";
						if (!contentType.includes("multipart/byteranges")) {
							throw new Error(`Expected multipart/byteranges response for multi-range request, got "${contentType}"`);
						}
						const parser = new StreamingMultipartParser(contentType);
						let partIndex = 0;
						const handleParts = async (parts: Uint8Array[]) => {
							for (const part of parts) {
								const descriptor = item.ranges[partIndex];
								if (!descriptor) {
									throw new Error(`Received more multipart parts than the ${item.ranges.length} signed ranges`);
								}
								const staged = decodePartChunks(part, descriptor, rangeList);
								tally.committed += commitChunks(staged);
								// Throughput signal counts decode work even for skipped (re-fetched) ranges
								state.decodedBytes += part.byteLength;
								partIndex++;
								notifier.notifyAll();
							}
						};
						for (;;) {
							if (state.error || state.finished) {
								return;
							}
							const result = await reader.read();
							listener?.({ event: "read" });
							if (result.done) {
								break;
							}
							if (result.value) {
								await handleParts(parser.push(result.value));
							}
						}
						await handleParts(parser.push());
						if (!state.finished && partIndex !== item.ranges.length) {
							throw new Error(
								`Multi-range fetch produced ${partIndex} parts but expected ${item.ranges.length} for ${item.hash}`,
							);
						}
					} else {
						// Single-range entry: parse the chunk stream, committing each range as it completes.
						const descriptor = item.ranges[0];
						const ranges = rangeList.getRanges(descriptor.chunks.start, descriptor.chunks.end);
						const staged = new Map<(typeof ranges)[number], Uint8Array[]>();
						let chunkIndex = descriptor.chunks.start;
						let leftover: Uint8Array | undefined;
						let done = false;
						while (!done) {
							if (state.error || state.finished) {
								return;
							}
							const result = await reader.read();
							listener?.({ event: "read" });
							done = result.done;
							let value = result.value;
							if (!value) {
								continue;
							}
							if (leftover) {
								value = combineUint8Arrays(leftover, value);
								leftover = undefined;
							}
							while (value.byteLength) {
								if (value.byteLength < XET_CHUNK_HEADER_BYTES) {
									leftover = value;
									break;
								}
								const chunkHeader = parseChunkHeader(
									new DataView(value.buffer, value.byteOffset, XET_CHUNK_HEADER_BYTES),
								);
								if (value.byteLength < XET_CHUNK_HEADER_BYTES + chunkHeader.compressed_length) {
									leftover = value;
									break;
								}
								const uncompressed = decompressChunk(
									chunkHeader,
									value.subarray(XET_CHUNK_HEADER_BYTES, XET_CHUNK_HEADER_BYTES + chunkHeader.compressed_length),
								);
								const range = ranges.find((r) => chunkIndex >= r.start && chunkIndex < r.end);
								if (range) {
									let chunks = staged.get(range);
									if (!chunks) {
										chunks = [];
										staged.set(range, chunks);
									}
									chunks.push(uncompressed);
									// Commit (and count) only when the range completes, and only if it wasn't
									// already committed by a previous attempt of this entry.
									if (chunkIndex === range.end - 1 && !range.data) {
										range.data = chunks;
										tally.committed += sum(chunks.map((chunk) => chunk.byteLength));
										notifier.notifyAll();
									}
								}
								state.decodedBytes += uncompressed.byteLength;
								chunkIndex++;
								value = value.slice(XET_CHUNK_HEADER_BYTES + chunkHeader.compressed_length);
							}
						}
						if (!state.finished) {
							for (const range of ranges) {
								if (!range.data) {
									throw new Error(
										`Failed to fetch all data for ${item.hash} chunks ${range.start}-${range.end} (stream ended early)`,
									);
								}
							}
						}
					}
				} finally {
					await reader.cancel().catch(() => {});
				}
			};

			// ---- Workers
			const isTransientNetworkError = (error: unknown) =>
				error instanceof TypeError || /terminated|socket|network|ECONNRESET|fetch failed/i.test(String(error));
			const runWorker = async (workerId: number) => {
				for (;;) {
					if (state.error || state.finished) {
						return;
					}
					if (workerId >= state.target) {
						await notifier.wait();
						continue;
					}
					const idx = state.nextEntry;
					if (idx >= plan.length) {
						return;
					}
					state.nextEntry++;
					state.claimed++;
					const est = estimateEntryBytes(plan[idx]);
					try {
						// Reserve budget BEFORE opening the connection, so streams are never stalled.
						await budgetAcquire(est, idx);
						if (state.error || state.finished) {
							// Cancelled or failed while waiting for budget: don't start the fetch.
							budgetRelease(est);
							return;
						}
						state.active++;
						state.maxActive = Math.max(state.maxActive, state.active);
						let lastError: unknown;
						// One tally across attempts: commits skip already-populated ranges, so bytes
						// committed by a failed attempt (possibly consumed and freed by the reader in
						// the meantime) are never double-counted, keeping the budget accounting exact.
						const tally = { committed: 0 };
						for (let attempt = 0; attempt < 2; attempt++) {
							try {
								await decodeEntry(plan[idx], idx, tally);
								// Swap the reservation for the actual committed bytes (released as consumed).
								budgetRelease(est - tally.committed);
								lastError = undefined;
								break;
							} catch (error) {
								lastError = error;
								if (attempt === 0 && !state.finished && isTransientNetworkError(error)) {
									log("retrying entry after transient error", plan[idx].hash, error);
									await delay(250);
									continue;
								}
							}
						}
						if (lastError) {
							// The download is failing: release the whole reservation. Bytes committed by a
							// partial attempt are not re-released by the consumer since it stops on error.
							budgetRelease(est);
							state.error ??= lastError;
						}
						state.active--;
					} finally {
						state.claimed--;
						notifier.notifyAll();
					}
				}
			};
			const workersDone = Promise.allSettled(Array.from({ length: maxConcurrency }, (_, i) => runWorker(i)));

			// ---- Adaptive concurrency controller (AIMD-style, throughput-driven)
			//
			// Every 500ms, compare aggregate decode throughput with the (decaying) best observed:
			// grow while extra connections keep improving it, back off on rate-limits or when
			// throughput regresses. This detects bandwidth saturation even when every request
			// succeeds, so capped links settle at low concurrency instead of adding contention.
			let lastBytes = 0;
			let lastRate = 0;
			let last429 = 0;
			const controller = setInterval(() => {
				const rate = state.decodedBytes - lastBytes;
				lastBytes = state.decodedBytes;
				if (state.count429 > last429) {
					last429 = state.count429;
					state.target = Math.max(1, state.target - 1);
				} else if (rate > lastRate * 1.05) {
					state.target = Math.min(maxConcurrency, state.target + 1);
				} else if (rate > 0 && rate < lastRate * 0.7) {
					state.target = Math.max(1, state.target - 1);
				}
				lastRate = Math.max(rate, lastRate * 0.9);
				state.targetHistory.push(state.target);
				notifier.notifyAll();
			}, 500);

			// ---- In-order consumer
			try {
				for (let termIdx = 0; termIdx < terms.length; termIdx++) {
					const term = terms[termIdx];
					if (totalBytesRead >= maxBytes) {
						break;
					}
					state.neededEntry = termEntryIndex[termIdx];
					notifier.notifyAll();

					const rangeList = rangeLists.get(term.hash);
					if (!rangeList) {
						throw new Error(`Failed to find range list for term ${term.hash}`);
					}
					let termRanges = rangeList.getRanges(term.range.start, term.range.end);
					while (!termRanges.every((range) => range.data)) {
						if (state.error) {
							throw state.error;
						}
						if (state.claimed === 0 && state.nextEntry >= plan.length) {
							throw new Error(
								`Download workers finished without producing data for term ${term.hash} range ${term.range.start}-${term.range.end}`,
							);
						}
						await notifier.wait();
						termRanges = rangeList.getRanges(term.range.start, term.range.end);
					}

					log("all data available for term", term.hash, readBytesToSkip);

					// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
					const cachedLength = sum(termRanges.map((range) => sum(range.data!.map((chunk) => chunk.byteLength))));
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
							yield range.refCount > 1 ? chunk.slice() : chunk;
							listener?.({ event: "progress", progress: { read: totalBytesRead, total: maxBytes } });

							if (totalBytesRead >= maxBytes) {
								break rangeLoop;
							}
						}
					}

					let freed = 0;
					for (const range of termRanges) {
						if (range.refCount === 1 && range.data) {
							freed += sum(range.data.map((chunk) => chunk.byteLength));
						}
					}
					rangeList.remove(term.range.start, term.range.end);
					budgetRelease(freed);
				}
			} finally {
				state.finished = true;
				clearInterval(controller);
				notifier.notifyAll();
				await workersDone;
				opts.onStat?.({
					entries: plan.length,
					maxActive: state.maxActive,
					finalTarget: state.target,
					count429: state.count429,
					targetHistory: state.targetHistory,
				});
			}
		}

		const iterator =
			parallelOptions && (parallelOptions.maxConcurrency ?? PARALLEL_DEFAULT_MAX_CONCURRENCY) > 1
				? readDataParallel(
						this.reconstructionInfo,
						this.fetch,
						this.end - this.start,
						this.#loadReconstructionInfo.bind(this),
						parallelOptions,
					)
				: readData(this.reconstructionInfo, this.fetch, this.end - this.start, this.#loadReconstructionInfo.bind(this));

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
				async cancel() {
					// Consumer cancelled the stream: return the generator so its cleanup runs
					// (parallel mode: stop workers, cancel in-flight readers, clear the controller timer).
					await iterator.return?.(undefined);
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
		// Consume the stream manually instead of via `new Response(stream).arrayBuffer()`:
		// browsers replace stream errors with a generic "Failed to fetch" TypeError, losing
		// the original error message.
		const reader = (await this.#fetch()).getReader();
		const chunks: Uint8Array[] = [];
		for (;;) {
			const { done, value } = await reader.read();
			if (done) {
				break;
			}
			chunks.push(value);
		}
		return concatUint8Arrays(chunks).buffer;
	}

	override async text(): Promise<string> {
		return new TextDecoder().decode(await this.arrayBuffer());
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
