import { createApiError } from "../error";
import type { CredentialsParams } from "../types/public";
import { checkCredentials } from "./checkCredentials";
import { combineUint8Arrays } from "./combineUint8Arrays";
import { decompress as lz4_decompress } from "../vendor/lz4js";
import { RangeList } from "./RangeList";
import { parseMultipartByteRanges } from "./multipart";

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
	 * Dictionnary of CAS block hash => list of ranges in the block + url to fetch it
	 */
	fetch_info: Record<
		string,
		Array<{
			url: string;
			/** Chunk range */
			range: { start: number; end: number };
			/**
			 * Byte range, when making the call to the URL.
			 *
			 * We assume that we're given non-overlapping ranges for each hash
			 */
			url_range: { start: number; end: number };
		}>
	>;
	/**
	 * When doing a range request, the offset into the term's uncompressed data. Can be multiple chunks' worth of data.
	 */
	offset_into_first_range: number;
}

/**
 * Response shape for `GET /v2/reconstructions/{hash}`.
 *
 * Unlike V1, a single signed URL can carry multiple byte ranges for a xorb. When more than one
 * range is requested from a URL, the server replies with a `multipart/byteranges` body.
 */
export interface ReconstructionInfoV2 {
	/**
	 * List of CAS blocks (same as V1).
	 */
	terms: Array<{
		hash: string;
		unpacked_length: number;
		range: { start: number; end: number };
	}>;

	/**
	 * Map from CAS block hash => list of multi-range fetch entries. Typically one entry per xorb;
	 * multiple entries when a URL length limit forces a split.
	 */
	xorbs: Record<
		string,
		Array<{
			/** Signed URL covering all of the ranges below. The exact multi-range Range header must be sent. */
			url: string;
			ranges: Array<{
				/** Chunk index range [start, end) within the xorb. */
				chunks: { start: number; end: number };
				/** Physical byte range [start, end] (inclusive end) for the HTTP Range header. */
				bytes: { start: number; end: number };
			}>;
		}>
	>;

	offset_into_first_range: number;
}

/**
 * A signed URL plus the chunk/byte ranges it covers. V1 and V2 reconstruction responses are both
 * normalized into this shape: V1 yields one single-range group per fetch entry, V2 keeps the
 * server's multi-range grouping.
 */
interface FetchGroup {
	url: string;
	ranges: Array<{
		/** Chunk index range [start, end). */
		range: { start: number; end: number };
		/** Byte range [start, end] (inclusive end) for the Range header. */
		url_range: { start: number; end: number };
	}>;
}

interface NormalizedReconstructionInfo {
	terms: ReconstructionInfo["terms"];
	/** Map from CAS block hash => fetch groups. */
	fetch_info: Record<string, FetchGroup[]>;
	offset_into_first_range: number;
}

function normalizeV1(info: ReconstructionInfo): NormalizedReconstructionInfo {
	const fetch_info: Record<string, FetchGroup[]> = {};
	for (const [hash, infos] of Object.entries(info.fetch_info)) {
		fetch_info[hash] = infos.map((info) => ({
			url: info.url,
			ranges: [{ range: info.range, url_range: info.url_range }],
		}));
	}
	return { terms: info.terms, fetch_info, offset_into_first_range: info.offset_into_first_range };
}

function normalizeV2(info: ReconstructionInfoV2): NormalizedReconstructionInfo {
	const fetch_info: Record<string, FetchGroup[]> = {};
	for (const [hash, fetches] of Object.entries(info.xorbs)) {
		fetch_info[hash] = fetches.map((fetch) => ({
			url: fetch.url,
			ranges: fetch.ranges.map((r) => ({ range: r.chunks, url_range: r.bytes })),
		}));
	}
	return { terms: info.terms, fetch_info, offset_into_first_range: info.offset_into_first_range };
}

/**
 * Cache of the detected reconstruction API version per CAS endpoint, to avoid re-probing V2 on
 * every request once we've learned an endpoint only supports V1.
 */
const reconstructionApiVersions = new Map<string, 1 | 2>();

// Exported for testing purposes: reset the per-endpoint reconstruction API version cache.
export function clearReconstructionApiVersionCache(): void {
	reconstructionApiVersions.clear();
}

/**
 * Build the reconstruction URL for a given API version, or undefined when it can't be built.
 *
 * When an explicit `reconstructionUrl` is provided (from the `xet-reconstruction-info` Link header,
 * which points at V1), other versions are derived by swapping the path segment.
 */
function reconstructionUrlForVersion(
	params: { reconstructionUrl?: string; casUrl: string; hash?: string },
	version: 1 | 2,
): string | undefined {
	if (params.reconstructionUrl) {
		if (version === 1) {
			return params.reconstructionUrl;
		}
		const derived = params.reconstructionUrl.replace("/v1/reconstructions/", `/v${version}/reconstructions/`);
		return derived === params.reconstructionUrl ? undefined : derived;
	}
	if (params.hash) {
		return `${params.casUrl}/v${version}/reconstructions/${params.hash}`;
	}
	return undefined;
}

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
			return compressed.slice();
	}
}

function parseSingleContentRange(value: string | null): { start: number; end: number } | undefined {
	const match = value?.match(/bytes\s+(\d+)-(\d+)\//i);
	return match ? { start: parseInt(match[1], 10), end: parseInt(match[2], 10) } : undefined;
}

/**
 * Decode a fully-buffered xorb chunk stream (one `multipart/byteranges` part) and store the
 * decompressed chunks into the range list, so the term reader can yield them from cache.
 */
function storeChunks(
	data: Uint8Array,
	descriptor: FetchGroup["ranges"][number],
	rangeList: RangeList<Uint8Array[]>,
): void {
	const ranges = rangeList.getRanges(descriptor.range.start, descriptor.range.end);
	let chunkIndex = descriptor.range.start;
	let offset = 0;

	while (offset < data.byteLength) {
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
			range.data ??= [];
			range.data.push(uncompressed);
		}

		chunkIndex++;
		offset = compressedEnd;
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
	reconstructionInfo: NormalizedReconstructionInfo | undefined;
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

	#reconstructionInfoPromise?: Promise<NormalizedReconstructionInfo>;

	#loadReconstructionInfo() {
		if (this.#reconstructionInfoPromise) {
			return this.#reconstructionInfoPromise;
		}

		this.#reconstructionInfoPromise = (async () => {
			const connParams = await getAccessToken(this.accessToken, this.fetch, this.refreshUrl);

			const rangeHeader = `bytes=${this.start}-${this.end - 1}`;
			const urlParams = { reconstructionUrl: this.reconstructionUrl, casUrl: connParams.casUrl, hash: this.hash };

			const fetchVersion = (version: 1 | 2): Promise<Response> | undefined => {
				const url = reconstructionUrlForVersion(urlParams, version);
				if (!url) {
					return undefined;
				}

				// debug(`curl '${url}' -H 'Authorization: Bearer ${connParams.accessToken}'`);

				return this.fetch(url, {
					headers: {
						Authorization: `Bearer ${connParams.accessToken}`,
						Range: rangeHeader,
					},
				});
			};

			// Prefer V2, falling back to V1 on 404/501, and remember the detected version per endpoint
			// to avoid re-probing. Mirrors xet-core's RemoteClient behavior.
			let version = reconstructionApiVersions.get(connParams.casUrl) ?? 2;

			let normalized: NormalizedReconstructionInfo | undefined;

			if (version === 2) {
				const resp = await fetchVersion(2);
				if (resp?.ok) {
					normalized = normalizeV2((await resp.json()) as ReconstructionInfoV2);
					reconstructionApiVersions.set(connParams.casUrl, 2);
				} else if (!resp || resp.status === 404 || resp.status === 501) {
					// V2 unavailable (or no V2 URL could be built): fall back to V1.
					version = 1;
				} else {
					throw await createApiError(resp);
				}
			}

			if (!normalized) {
				const resp = await fetchVersion(1);
				if (!resp) {
					throw new Error("Failed to build reconstruction URL");
				}
				if (!resp.ok) {
					throw await createApiError(resp);
				}
				normalized = normalizeV1((await resp.json()) as ReconstructionInfo);
				reconstructionApiVersions.set(connParams.casUrl, 1);
			}

			this.reconstructionInfo = normalized;

			return normalized;
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
			reconstructionInfo: NormalizedReconstructionInfo,
			customFetch: typeof fetch,
			maxBytes: number,
			reloadReconstructionInfo: () => Promise<NormalizedReconstructionInfo>,
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

				// Locate the fetch group + descriptor whose chunk range covers this term.
				const locate = (info: NormalizedReconstructionInfo) => {
					const groups = info.fetch_info[term.hash];
					if (groups) {
						for (const group of groups) {
							const descriptor = group.ranges.find(
								(r) => r.range.start <= term.range.start && r.range.end >= term.range.end,
							);
							if (descriptor) {
								return { group, descriptor };
							}
						}
					}
					return undefined;
				};

				// Fetch a multi-range group (V2) in one request, parse the multipart/byteranges response,
				// and populate the range list cache. The signed URL covers the exact set of ranges, so we
				// must request all of them together rather than one at a time.
				const fetchMultiRangeGroup = async (group: FetchGroup): Promise<void> => {
					const rangeHeaderFor = (g: FetchGroup) =>
						`bytes=${g.ranges.map((r) => `${r.url_range.start}-${r.url_range.end}`).join(",")}`;

					let resp = await customFetch(group.url, { headers: { Range: rangeHeaderFor(group) } });

					if (resp.status === 403) {
						// Signed URL expired: reload reconstruction info and relocate the covering group.
						reconstructionInfo = await reloadReconstructionInfo();
						const relocated = locate(reconstructionInfo);
						if (!relocated) {
							throw new Error(
								`Failed to find fetch info for term ${term.hash} and range ${term.range.start}-${term.range.end} after refresh`,
							);
						}
						group = relocated.group;
						resp = await customFetch(group.url, { headers: { Range: rangeHeaderFor(group) } });
					}

					if (!resp.ok) {
						throw await createApiError(resp);
					}

					listener?.({ event: "read" });

					const body = new Uint8Array(await resp.arrayBuffer());
					const contentType = resp.headers.get("content-type") ?? "";

					const parts = contentType.includes("multipart/byteranges")
						? parseMultipartByteRanges(contentType, body)
						: // Single-range response (eg the server merged contiguous ranges): map the whole body to
						  // the matching descriptor by Content-Range, falling back to the first requested range.
						  [
								{
									range: parseSingleContentRange(resp.headers.get("content-range")) ?? group.ranges[0].url_range,
									data: body,
								},
						  ];

					for (const part of parts) {
						const descriptor =
							group.ranges.find((r) => r.url_range.start === part.range.start && r.url_range.end === part.range.end) ??
							group.ranges.find((r) => r.url_range.start === part.range.start);
						if (!descriptor) {
							throw new Error(
								`Multipart part bytes=${part.range.start}-${part.range.end} did not match any requested range for term ${term.hash}`,
							);
						}
						storeChunks(part.data, descriptor, rangeList);
					}
				};

				let termRanges = rangeList.getRanges(term.range.start, term.range.end);

				if (!termRanges.every((range) => range.data)) {
					const located = locate(reconstructionInfo);
					if (located && located.group.ranges.length > 1) {
						await fetchMultiRangeGroup(located.group);
						termRanges = rangeList.getRanges(term.range.start, term.range.end);
					}
				}

				if (termRanges.every((range) => range.data)) {
					log("all data available for term", term.hash, readBytesToSkip);
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

				// Single-range group (all V1, and V2 xorbs with a single range): stream and parse inline.
				let located = locate(reconstructionInfo);
				if (!located) {
					throw new Error(
						`Failed to find fetch info for term ${term.hash} and range ${term.range.start}-${term.range.end}`,
					);
				}
				let fetchInfo = located.descriptor;

				log("term", term);
				log("fetchinfo", fetchInfo);
				log("readBytesToSkip", readBytesToSkip);

				let resp = await customFetch(located.group.url, {
					headers: {
						Range: `bytes=${fetchInfo.url_range.start}-${fetchInfo.url_range.end}`,
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
					fetchInfo = located.descriptor;
					resp = await customFetch(located.group.url, {
						headers: {
							Range: `bytes=${fetchInfo.url_range.start}-${fetchInfo.url_range.end}`,
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
					fetchInfo.url_range,
					resp.headers.get("content-range"),
				);

				const reader = resp.body?.getReader();
				if (!reader) {
					throw new Error("Failed to get reader from response body");
				}

				let done = false;
				let chunkIndex = fetchInfo.range.start;
				const ranges = rangeList.getRanges(fetchInfo.range.start, fetchInfo.range.end);

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

						// Assuming non-overlapping fetch_info ranges for the same hash
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

				if (
					done &&
					totalBytesRead < maxBytes &&
					totalFetchBytes < fetchInfo.url_range.end - fetchInfo.url_range.start + 1
				) {
					log("done", done, "total read", totalBytesRead, maxBytes, totalFetchBytes);
					log("failed to fetch all data for term", term.hash);
					throw new Error(
						`Failed to fetch all data for term ${term.hash}, fetched ${totalFetchBytes} bytes out of ${
							fetchInfo.url_range.end - fetchInfo.url_range.start + 1
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
