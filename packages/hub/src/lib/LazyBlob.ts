import { createReadStream } from "node:fs";
import { open } from "node:fs/promises";
import type { FileHandle } from "node:fs/promises";
import { Readable } from "node:stream";

export class LazyBlob {
	static async create(path: string) {
		const lazyBlob = new LazyBlob(path);

		await lazyBlob.init();

		return lazyBlob;
	}

	private path: string;
	private file: FileHandle | null;
	private totalSize: number;

	private constructor(path: string) {
		this.path = path;

		this.file = null;
		this.totalSize = 0;
	}

	get size(): number {
		return this.totalSize;
	}

	get lentgh(): number {
		return this.size;
	}

	get type(): string {
		return "";
	}

	async dispose(): Promise<void> {
		if (this.file === null) {
			return;
		}

		await this.file.close();
	}

	async slice(start = 0, end = this.size): Promise<Blob> {
		if (this.file === null) {
			throw new Error("LazyBlob has not been initialized");
		}

		const size = Math.abs(end - start) > this.size ? this.size : Math.abs(end - start);

		const slice = await this.file.read(Buffer.alloc(size), 0, size, start);

		return new Blob([slice.buffer]);
	}

	async blob(): Promise<Blob> {
		if (this.file === null) {
			throw new Error("LazyBlob has not been initialized");
		}

		return this.slice(0, this.size);
	}

	async arrayBuffer(): Promise<ArrayBuffer> {
		if (this.file === null) {
			throw new Error("LazyBlob has not been initialized");
		}

		const slice = await this.file.read(Buffer.alloc(this.size), 0, this.size, 0);

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
		this.file = await open(this.path, "r");

		const { size } = await this.file.stat();
		this.totalSize = size;
	}
}
