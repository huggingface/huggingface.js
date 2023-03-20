import { createReadStream } from "node:fs";
import { open, stat } from "node:fs/promises";
import { Readable } from "node:stream";
import type { FileHandle } from "node:fs/promises";

/**
 * @internal
 *
 * A LazyBlob is a replacement for the Blob class that allows to lazy read files
 * in order to preserve memory.
 *
 * It is a drop-in replacement for the Blob class, so you can use it as a Blob.
 *
 * The main difference is the instantiation, which is done asynchronously using the `LazyBlob.create` method.
 *
 * @example
 * const lazyBlob = await LazyBlob.create("path/to/package.json");
 *
 * await fetch("https://aschen.tech", { method: "POST", body: lazyBlob });
 */
export class LazyBlob extends Blob {
	/**
	 * Creates a new LazyBlob on the provided file.
	 *
	 * @param path Path to the file to be lazy readed
	 */
	static async create(path: URL): Promise<LazyBlob> {
		const { size } = await stat(path);

		const lazyBlob = new LazyBlob(path, 0, size);

		return lazyBlob;
	}

	private path: URL;
	private start: number;
	private end: number;

	private constructor(path: URL, start: number, end: number) {
		super();

		this.path = path;
		this.start = start;
		this.end = end;
	}

	/**
	 * Returns the size of the blob.
	 */
	get size(): number {
		return this.end - this.start;
	}

	/**
	 * Returns an empty string.
	 * (This is a required property of the Blob class)
	 */
	get type(): string {
		return "";
	}

	/**
	 * Returns a new instance of LazyBlob that is a slice of the current one.
	 *
	 * The slice is inclusive of the start and exclusive of the end.
	 *
	 * The slice method does not supports negative start/end.
	 *
	 * @param start beginning of the slice
	 * @param end end of the slice
	 */
	slice(start = 0, end = this.size): LazyBlob {
		if (start < 0 || end < 0) {
			new TypeError("Unsupported negative start/end on LazyBlob.slice");
		}

		const slice = new LazyBlob(this.path, this.start + start, Math.min(this.start + end, this.end));

		return slice;
	}

	/**
	 * Read the part of the file delimited by the LazyBlob and returns it as an ArrayBuffer.
	 */
	async arrayBuffer(): Promise<ArrayBuffer> {
		const slice = await this.execute((file) => file.read(Buffer.alloc(this.size), 0, this.size, this.start));

		return slice.buffer;
	}

	/**
	 * Read the part of the file delimited by the LazyBlob and returns it as a string.
	 */
	async text(): Promise<string> {
		const buffer = (await this.arrayBuffer()) as Buffer;

		return buffer.toString("utf8");
	}

	/**
	 * Returns a stream around the part of the file delimited by the LazyBlob.
	 */
	stream(): ReturnType<Blob["stream"]> {
		return Readable.toWeb(createReadStream(this.path, { start: this.start, end: this.end - 1 })) as ReturnType<
			Blob["stream"]
		>;
	}

	/**
	 * We are opening and closing the file for each action to prevent file descriptor leaks.
	 *
	 * It is an intended choice of developer experience over performances.
	 */
	private async execute<T>(action: (file: FileHandle) => Promise<T>) {
		const file = await open(this.path, "r");

		const ret = await action(file);

		await file.close();

		return ret;
	}
}
