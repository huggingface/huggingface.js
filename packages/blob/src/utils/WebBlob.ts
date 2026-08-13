/**
 * WebBlob is a Blob implementation for web resources that supports range requests.
 */

interface WebBlobCreateOptions {
	/**
	 * @default 1_000_000
	 *
	 * Objects below that size will immediately be fetched and put in RAM, rather
	 * than streamed ad-hoc
	 */
	cacheBelow?: number;
	/**
	 * Custom fetch function to use instead of the default one, for example to use a proxy or edit headers.
	 */
	fetch?: typeof fetch;
}

export class WebBlob extends Blob {
	static async create(url: URL, opts?: WebBlobCreateOptions): Promise<Blob> {
		const customFetch = opts?.fetch ?? fetch;

		// Probe with `Range: bytes=0-0` rather than `HEAD` to learn the file size
		// and confirm range support in a single round trip.
		//
		// In browsers, when CloudFront gzips a response on the fly (typical for
		// small text/JSON files behind `/api/resolve-cache/...`), the cached
		// response loses both `Content-Length` and `Accept-Ranges`. Subsequent
		// HEAD requests served from that cache inherit the missing headers, so
		// the lib could not tell either the file size or whether ranges were
		// supported, and silently fell back to buffering the whole blob in RAM.
		//
		// Range responses are never content-encoded, so `Content-Range`
		// (carrying the total size) always survives, regardless of the cached
		// encoding state.
		const probe = await customFetch(url, {
			headers: {
				Range: "bytes=0-0",
			},
		});

		if (!probe.ok) {
			throw new Error(`Failed to fetch ${url}: ${probe.status} ${probe.statusText}`);
		}

		const contentType = probe.headers.get("content-type") || "";

		// 206 → server honored the range request; total size is in `Content-Range`.
		if (probe.status === 206) {
			const totalSize = Number(probe.headers.get("content-range")?.split("/").pop());
			await probe.body?.cancel();

			if (Number.isFinite(totalSize) && totalSize >= (opts?.cacheBelow ?? 1_000_000)) {
				return new WebBlob(url, 0, totalSize, contentType, true, customFetch);
			}

			// Small file (or unknown total) → buffer it in RAM.
			const full = await customFetch(url);
			if (!full.ok) {
				throw new Error(`Failed to fetch ${url}: ${full.status} ${full.statusText}`);
			}
			return full.blob();
		}

		// 200 → server ignored `Range`; we've already started downloading the
		// full body, so just consume it.
		return probe.blob();
	}

	private url: URL;
	private start: number;
	private end: number;
	private contentType: string;
	private full: boolean;
	private fetch: typeof fetch;

	constructor(url: URL, start: number, end: number, contentType: string, full: boolean, customFetch: typeof fetch) {
		super([]);

		this.url = url;
		this.start = start;
		this.end = end;
		this.contentType = contentType;
		this.full = full;
		this.fetch = customFetch;
	}

	override get size(): number {
		return this.end - this.start;
	}

	override get type(): string {
		return this.contentType;
	}

	override slice(start = 0, end = this.size): WebBlob {
		if (start < 0 || end < 0) {
			throw new TypeError("Unsupported negative start/end on WebBlob.slice");
		}

		const slice = new WebBlob(
			this.url,
			this.start + start,
			Math.min(this.start + end, this.end),
			this.contentType,
			start === 0 && end === this.size ? this.full : false,
			this.fetch,
		);

		return slice;
	}

	override async arrayBuffer(): Promise<ArrayBuffer> {
		const result = await this.fetchRange();

		return result.arrayBuffer();
	}

	override async text(): Promise<string> {
		const result = await this.fetchRange();

		return result.text();
	}

	override stream(): ReturnType<Blob["stream"]> {
		const stream = new TransformStream();

		this.fetchRange()
			.then((response) => response.body?.pipeThrough(stream))
			.catch((error) => stream.writable.abort(error.message));

		return stream.readable;
	}

	private fetchRange(): Promise<Response> {
		const fetch = this.fetch; // to avoid this.fetch() which is bound to the instance instead of globalThis
		if (this.full) {
			return fetch(this.url);
		}
		return fetch(this.url, {
			headers: {
				Range: `bytes=${this.start}-${this.end - 1}`,
			},
		});
	}
}
