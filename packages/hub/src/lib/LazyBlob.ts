import { createReadStream } from "node:fs";
import { open } from "node:fs/promises";
import type { FileHandle } from "node:fs/promises";

export class LazyBlob {
	private path: string;
	private file: FileHandle | null;
	private totalSize: number;

	constructor(path: string) {
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

	async init(): Promise<void> {
		this.file = await open(this.path, "r");

		const { size } = await this.file.stat();
		this.totalSize = size;
	}

	async dispose(): Promise<void> {
		if (this.file === null) {
			return;
		}

		await this.file.close();
	}

	async slice(start: number, end: number): Promise<Blob> {
		if (this.file === null) {
			throw new Error("LazyBlob has not been initialized");
		}

		const size = end - start;
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

		return stream as unknown as ReadableStream;
	}
}
