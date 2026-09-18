/** Structural match for hyparquet's `AsyncBuffer`, declared here so the type is not a hard dependency. */
export interface RandomAccessFile {
	byteLength: number;
	slice(start: number, end?: number): Promise<ArrayBuffer>;
}

export interface FetchOptions {
	/** Custom fetch, for example to add credentials or an `Authorization` header. */
	fetch?: typeof fetch;
	additionalFetchHeaders?: Record<string, string>;
}

export interface RangeResult {
	bytes: Uint8Array;
	/** Total size of the file, parsed from `Content-Range`. Absent when the server does not report it. */
	total?: number;
}

/** `bytes 68464-72559/72560` — the trailing total is free information on every range response. */
function parseTotalFromContentRange(contentRange: string | null): number | undefined {
	const total = contentRange?.match(/\/\s*(\d+)\s*$/)?.[1];
	if (total === undefined) {
		return undefined;
	}
	const parsed = Number(total);
	return Number.isSafeInteger(parsed) && parsed >= 0 ? parsed : undefined;
}

async function request(url: string, headers: Record<string, string>, options?: FetchOptions): Promise<Response> {
	const response = await (options?.fetch ?? fetch)(url, {
		headers: { ...(options?.additionalFetchHeaders ?? {}), ...headers },
	});
	if (!response.ok) {
		throw new Error(`Failed to fetch ${url} (HTTP ${response.status})`);
	}
	return response;
}

/** Reads `[start, end]` inclusive, or the last `-start` bytes when `start` is negative and `end` is omitted. */
export async function fetchRange(
	url: string,
	start: number,
	end: number | undefined,
	options?: FetchOptions,
): Promise<RangeResult> {
	const range = start < 0 && end === undefined ? `bytes=${start}` : `bytes=${start}-${end ?? ""}`;
	const response = await request(url, { Range: range }, options);
	return {
		bytes: new Uint8Array(await response.arrayBuffer()),
		total: parseTotalFromContentRange(response.headers.get("content-range")),
	};
}

/** Reads at most `maxBytes` from the start of a file and decodes it as UTF-8. */
export async function fetchTextPrefix(url: string, maxBytes: number, options?: FetchOptions): Promise<string> {
	const { bytes } = await fetchRange(url, 0, maxBytes - 1, options);
	return new TextDecoder().decode(bytes);
}

const TAIL_PROBE_BYTES = 64 * 1024;

/**
 * Opens a remote file for random access.
 *
 * The first request is a suffix range, which yields both the file size and the parquet footer in one
 * round trip; later reads inside that tail are served from memory.
 */
export async function openRemoteFile(url: string, options?: FetchOptions): Promise<RandomAccessFile> {
	const tail = await fetchRange(url, -TAIL_PROBE_BYTES, undefined, options);
	const byteLength = tail.total ?? tail.bytes.byteLength;
	const tailStart = byteLength - tail.bytes.byteLength;

	return {
		byteLength,
		async slice(start: number, end?: number): Promise<ArrayBuffer> {
			const stop = end ?? byteLength;
			if (start >= tailStart && stop <= byteLength) {
				return tail.bytes.slice(start - tailStart, stop - tailStart).buffer as ArrayBuffer;
			}
			const { bytes } = await fetchRange(url, start, stop - 1, options);
			return bytes.buffer as ArrayBuffer;
		},
	};
}
