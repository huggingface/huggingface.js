import { sum } from "./sum";

/**
 * @internal
 *
 * A SplicedBlob is a Blob that represents the result of splicing an insert blob
 * into an original blob at a specified position, replacing content between start and end.
 *
 * It is a drop-in replacement for the Blob class, so you can use it as a Blob.
 * The splicing is done virtually without copying data until accessed.
 *
 * @example
 * const originalBlob = new Blob(["Hello, World!"]);
 * const insertBlob = new Blob(["Beautiful "]);
 * const splicedBlob = SplicedBlob.create(originalBlob, insertBlob, 7, 7);
 * // Result represents: "Hello, Beautiful World!"
 */
export class SplicedBlob extends Blob {
	/**
	 * Creates a new SplicedBlob by splicing an insert blob into an original blob.
	 *
	 * @param originalBlob The original blob to splice into
	 * @param insertBlob The blob to insert
	 * @param start The position where splicing starts (inclusive)
	 * @param end The position where splicing ends (exclusive). Content between start and end is replaced.
	 */
	static create(originalBlob: Blob, insertBlob: Blob, start: number, end: number): SplicedBlob {
		if (start < 0 || end < 0 || start > originalBlob.size || end > originalBlob.size || start > end) {
			throw new TypeError("Invalid start/end positions for SplicedBlob");
		}

		return new SplicedBlob(originalBlob, insertBlob, start, end);
	}

	private originalBlob: Blob;
	private insertBlob: Blob;
	private spliceStart: number;
	private spliceEnd: number;

	private constructor(originalBlob: Blob, insertBlob: Blob, start: number, end: number) {
		super();

		this.originalBlob = originalBlob;
		this.insertBlob = insertBlob;
		this.spliceStart = start;
		this.spliceEnd = end;
	}

	/**
	 * Returns the size of the spliced blob.
	 * Size = (original size - replaced segment size) + insert size
	 */
	override get size(): number {
		return this.originalBlob.size - (this.spliceEnd - this.spliceStart) + this.insertBlob.size;
	}

	/**
	 * Returns the MIME type of the original blob.
	 */
	override get type(): string {
		return this.originalBlob.type;
	}

	/**
	 * Returns a new instance of SplicedBlob that is a slice of the current one.
	 *
	 * The slice is inclusive of the start and exclusive of the end.
	 * The slice method does not support negative start/end.
	 *
	 * @param start beginning of the slice
	 * @param end end of the slice
	 */
	override slice(start = 0, end = this.size): Blob {
		if (start < 0 || end < 0) {
			throw new TypeError("Unsupported negative start/end on SplicedBlob.slice");
		}

		start = Math.min(start, this.size);
		end = Math.min(end, this.size);

		if (start >= end) {
			return new Blob([]);
		}

		// Calculate segment boundaries
		const beforeSegmentSize = this.spliceStart;
		const insertSegmentSize = this.insertBlob.size;
		const afterSegmentStart = beforeSegmentSize + insertSegmentSize;

		// Determine which segments the slice spans
		if (end <= beforeSegmentSize) {
			// Slice is entirely in the before segment
			return this.originalBlob.slice(start, end);
		}

		if (start >= afterSegmentStart) {
			// Slice is entirely in the after segment
			const afterStart = start - afterSegmentStart + this.spliceEnd;
			const afterEnd = end - afterSegmentStart + this.spliceEnd;
			return this.originalBlob.slice(afterStart, afterEnd);
		}

		if (start >= beforeSegmentSize && end <= afterSegmentStart) {
			// Slice is entirely in the insert segment
			return this.insertBlob.slice(start - beforeSegmentSize, end - beforeSegmentSize);
		}

		// Slice spans multiple segments - need to create a new SplicedBlob or combine blobs
		const segments: Blob[] = [];

		if (start < beforeSegmentSize) {
			// Include part of before segment
			segments.push(this.originalBlob.slice(start, Math.min(end, beforeSegmentSize)));
		}

		if (start < afterSegmentStart && end > beforeSegmentSize) {
			// Include part of insert segment
			const insertStart = Math.max(0, start - beforeSegmentSize);
			const insertEnd = Math.min(insertSegmentSize, end - beforeSegmentSize);
			segments.push(this.insertBlob.slice(insertStart, insertEnd));
		}

		if (end > afterSegmentStart) {
			// Include part of after segment
			const afterStart = Math.max(this.spliceEnd, this.spliceEnd + (start - afterSegmentStart));
			const afterEnd = this.spliceEnd + (end - afterSegmentStart);
			segments.push(this.originalBlob.slice(afterStart, afterEnd));
		}

		return new Blob(segments);
	}

	/**
	 * Read the spliced blob content and returns it as an ArrayBuffer.
	 */
	override async arrayBuffer(): Promise<ArrayBuffer> {
		const segments = this.segments;
		const buffers = await Promise.all(segments.map((segment) => segment.arrayBuffer()));

		// Concatenate all buffers
		const totalSize = sum(buffers.map((buffer) => buffer.byteLength));
		const result = new Uint8Array(totalSize);

		let offset = 0;
		for (const buffer of buffers) {
			result.set(new Uint8Array(buffer), offset);
			offset += buffer.byteLength;
		}

		return result.buffer;
	}

	/**
	 * Read the spliced blob content and returns it as a string.
	 */
	override async text(): Promise<string> {
		const buffer = await this.arrayBuffer();
		return new TextDecoder().decode(buffer);
	}

	/**
	 * Returns a stream around the spliced blob content.
	 */
	override stream(): ReturnType<Blob["stream"]> {
		const readable = new ReadableStream({
			start: async (controller) => {
				try {
					const segments = this.segments;

					for (const segment of segments) {
						const reader = segment.stream().getReader();

						try {
							while (true) {
								const { done, value } = await reader.read();
								if (done) {
									break;
								}
								controller.enqueue(value);
							}
						} finally {
							reader.releaseLock();
						}
					}

					controller.close();
				} catch (error) {
					controller.error(error);
				}
			},
		});

		return readable;
	}

	/**
	 * Get the three segments that make up the spliced blob.
	 */
	private get segments(): Blob[] {
		const segments: Blob[] = [];

		// Before segment (0 to start)
		if (this.spliceStart > 0) {
			segments.push(this.originalBlob.slice(0, this.spliceStart));
		}

		// Insert segment (entire insert blob)
		if (this.insertBlob.size > 0) {
			segments.push(this.insertBlob);
		}

		// After segment (end to original.size)
		if (this.spliceEnd < this.originalBlob.size) {
			segments.push(this.originalBlob.slice(this.spliceEnd));
		}

		return segments;
	}
}
