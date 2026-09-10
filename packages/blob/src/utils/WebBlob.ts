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
		const cacheBelow = opts?.cacheBelow ?? 1_000_000;
		const response = await customFetch(url, { method: "HEAD" });
		let size = Number(response.headers.get("content-length"));
		let contentType = response.headers.get("content-type") || "";
		let supportRange = response.headers.get("accept-ranges") === "bytes";
		const knownSize = Number.isFinite(size) && size > 0;

		// A HEAD response can lack both `content-length` and `accept-ranges` (see #2118, which replaced the
		// HEAD call in the packages/hub copy of this file for that reason), and neither absence means the
		// server cannot serve ranges. Probe only when the answer can change the outcome: HEAD gave no usable
		// size, or it withheld `accept-ranges` for a resource large enough to have taken the lazy path.
		if (!knownSize || (!supportRange && size >= cacheBelow)) {
			const probe = await customFetch(url, { headers: { Range: "bytes=0-0" } });
			const contentRange = probe.headers.get("content-range");
			const totalMatch = contentRange?.match(/^bytes\s+0-0\/(\d+)$/i);

			if (probe.status === 200) {
				// The server ignored `Range` and sent the whole body already.
				return await probe.blob();
			}

			if (probe.status === 416 && contentRange?.match(/^bytes\s+\*\/0$/i)) {
				await probe.body?.cancel();
				return new Blob([], { type: probe.headers.get("content-type") || contentType });
			}

			if (probe.status !== 206 || !totalMatch || Number(totalMatch[1]) <= 0) {
				// Nothing conclusive came back: keep the previous behaviour and GET the whole thing.
				await probe.body?.cancel();
				return await (await customFetch(url)).blob();
			}

			size = Number(totalMatch[1]);
			contentType = probe.headers.get("content-type") || contentType;
			supportRange = true;
			await probe.body?.cancel();
		}

		if (!supportRange || size < cacheBelow) {
			return await (await customFetch(url)).blob();
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
