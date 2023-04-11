import { isFrontend } from "./env-predicates";

/**
 * Browsers does not support WebBlob in fetch
 * https://bugzilla.mozilla.org/show_bug.cgi?id=1826243
 * https://bugs.chromium.org/p/chromium/issues/detail?id=1430298
 */
export function isBlobSupportedByFetch(blob: Blob): boolean {
	return !(blob instanceof WebBlob && isFrontend);
}

/**
 * WebBlob is a Blob implementation for web resources that supports range requests.
 */

interface WebBlobCreateOptions {
	/**
	 * Default: 1_000_000
	 *
	 * Objects below that size will immediately be fetched and put in RAM, rather
	 * than streamed ad-hoc
	 */
	cacheBelow: number;
}

export class WebBlob extends Blob {
	static async create(url: URL, opts: WebBlobCreateOptions = { cacheBelow: 1_000_000 }): Promise<Blob> {
		const response = await fetch(url, { method: "HEAD" });

		const size = Number(response.headers.get("content-length"));
		const contentType = response.headers.get("content-type") || "";
		const supportRange = response.headers.get("accept-ranges") === "bytes";

		if (!supportRange || size < opts.cacheBelow) {
			return await (await fetch(url)).blob();
		}

		return new WebBlob(url, 0, size, contentType, true);
	}

	private url: URL;
	private start: number;
	private end: number;
	private contentType: string;
	private full: boolean;

	constructor(url: URL, start: number, end: number, contentType: string, full: boolean) {
		super([]);

		this.url = url;
		this.start = start;
		this.end = end;
		this.contentType = contentType;
		this.full = full;
	}

	get size(): number {
		return this.end - this.start;
	}

	get type(): string {
		return this.contentType;
	}

	slice(start = 0, end = this.size): WebBlob {
		if (start < 0 || end < 0) {
			new TypeError("Unsupported negative start/end on WebBlob.slice");
		}

		const slice = new WebBlob(
			this.url,
			this.start + start,
			Math.min(this.start + end, this.end),
			this.contentType,
			start === 0 && end === this.size ? this.full : false
		);

		return slice;
	}

	async arrayBuffer(): Promise<ArrayBuffer> {
		const result = await this.fetchRange();

		return result.arrayBuffer();
	}

	async text(): Promise<string> {
		const result = await this.fetchRange();

		return result.text();
	}

	stream(): ReturnType<Blob["stream"]> {
		const stream = new TransformStream();

		this.fetchRange()
			.then((response) => response.body?.pipeThrough(stream))
			.catch((error) => stream.writable.abort(error.message));

		return stream.readable;
	}

	private fetchRange(): Promise<Response> {
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
