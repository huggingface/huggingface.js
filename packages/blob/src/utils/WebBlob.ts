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
		const fetchFullBlob = async () => {
			const full = await customFetch(url);
			if (!full.ok) {
				await full.body?.cancel();
				throw new Error(`Failed to fetch resource: HTTP ${full.status}`);
			}
			return full.blob();
		};
		// A range probe exposes the total even when a CDN omits HEAD headers.
		const response = await customFetch(url, { headers: { Range: "bytes=0-0" } });
		// An empty resource has no satisfiable byte range; retry without Range.
		if (response.status === 416) {
			await response.body?.cancel();
			return fetchFullBlob();
		}
		if (!response.ok) {
			await response.body?.cancel();
			throw new Error(`Failed to fetch resource: HTTP ${response.status}`);
		}
		const contentType = response.headers.get("content-type") || "";

		// If ranges are ignored, reuse the full response we already received.
		if (response.status !== 206) {
			return response.blob();
		}

		const size = Number(response.headers.get("content-range")?.split("/").pop());
		await response.body?.cancel();
		if (!Number.isFinite(size) || size < (opts?.cacheBelow ?? 1_000_000)) {
			return fetchFullBlob();
		}

		return new WebBlob(url, 0, size, contentType, true, customFetch);
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
