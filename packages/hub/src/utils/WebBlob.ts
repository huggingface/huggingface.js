export class WebBlob {
	static async create(url: URL) {
		const response = await fetch(url, { method: "HEAD" });

		const size = Number(response.headers.get("content-length"));
		const contentType = response.headers.get("content-type") || "";
		const supportRange = response.headers.get("accept-ranges") === "bytes";

		if (!supportRange) {
			return await (await fetch(url)).blob();
		}

		return new WebBlob(url, 0, size, contentType);
	}

	private url: URL;
	private start: number;
	private end: number;
	private contentType: string;

	constructor(url: URL, start: number, end: number, contentType: string) {
		this.url = url;
		this.start = start;
		this.end = end;
		this.contentType = contentType;
	}

	get size(): number {
		return this.end - this.start;
	}

	get type(): string {
		return this.contentType;
	}

	slice(start = 0, end = this.size): WebBlob {
		if (start < 0 || end < 0) {
			new TypeError("Unsupported negative start/end on FileBlob.slice");
		}

		const slice = new WebBlob(this.url, this.start + start, Math.min(this.start + end, this.end), this.contentType);

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

	async stream(): Promise<ReturnType<Blob["stream"]>> {
		const response = await this.fetchRange();

		return response.body as ReturnType<Blob["stream"]>;
	}

	private fetchRange(): Promise<Response> {
		return fetch(this.url, {
			headers: {
				Range: `bytes=${this.start}-${this.end - 1}`,
			},
		});
	}
}
