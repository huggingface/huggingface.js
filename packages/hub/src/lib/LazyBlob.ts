import { createReadStream } from "node:fs";
import { open, stat } from "node:fs/promises";
import type { FileHandle } from "node:fs/promises";
import { Readable } from "node:stream";

export class LazyBlob extends Blob {
	static async create(path: string): Promise<LazyBlob> {
		const { size } = await stat(path);

		const lazyBlob = new LazyBlob(path, 0, size);

		return lazyBlob;
	}

	private path: string;
	private start: number;
	private end: number;
	private totalSize: number;

	private constructor(path: string, start: number, end: number) {
		super();

		this.path = path;
		this.start = start;
		this.end = end;

		this.totalSize = 0;
	}

	get size(): number {
		if (this.start !== null) {
			if (this.end !== null) {
				return Math.abs(this.end - this.start);
			}

			return this.totalSize - this.start;
		}

		return this.totalSize;
	}

	get type(): string {
		return "";
	}

	slice(start = 0, end = this.size): LazyBlob {
		if (start < 0 || end < 0) {
			new TypeError("Unsupported negative start/end on LazyBlob.slice");
		}

		const slice = new LazyBlob(this.path, this.start + start, Math.min(this.start + end, this.end));

		return slice;
	}

	async arrayBuffer(): Promise<ArrayBuffer> {
		const slice = await this.execute((file) => file.read(Buffer.alloc(this.size), 0, this.size, this.start));

		return slice.buffer;
	}

	async text(): Promise<string> {
		const buffer = (await this.arrayBuffer()) as Buffer;

		return buffer.toString("utf8");
	}

	stream(): ReadableStream {
		return Readable.toWeb(createReadStream(this.path));
	}

	private async init(): Promise<void> {
		const { size } = await this.execute((file) => file.stat());

		this.totalSize = size;
	}

	private async execute<T>(action: (file: FileHandle) => Promise<T>) {
		const file = await open(this.path, "r");

		const ret = await action(file);

		await file.close();

		return ret;
	}
}
