import { createReadStream } from "node:fs";
import { open } from "node:fs/promises";
import type { FileHandle } from "node:fs/promises";
import { Readable } from "node:stream";

export class LazyBlob extends Blob {
	static async create(path: string, start?: number, end?: number): Promise<LazyBlob> {
		const lazyBlob = new LazyBlob(path, start, end);

		await lazyBlob.init();

		return lazyBlob;
	}

	private path: string;
	private start: number | null;
	private end: number | null;
	private totalSize: number;

	private constructor(path: string, start?: number, end?: number) {
		super();

		this.path = path;
		this.start = start || null;
		this.end = end || null;

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
		const slice = new LazyBlob(this.path, start, end);

		return slice;
	}

	async blob(): Promise<Blob> {
		return this.slice(0, this.size);
	}

	async arrayBuffer(): Promise<ArrayBuffer> {
		const start = this.start || 0;
		const end = this.end || this.size;
		const size = Math.abs(end - start);
		const cappedSize = size > this.size ? this.size : size;

		const slice = await this.execute((file) => file.read(Buffer.alloc(cappedSize), 0, cappedSize, 0));

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
