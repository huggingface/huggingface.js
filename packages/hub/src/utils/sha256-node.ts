import { Readable } from "node:stream";
import type { ReadableStream } from "node:stream/web";
import { createHash } from "node:crypto";

export async function* sha256Node(buffer: ArrayBuffer | Blob): AsyncGenerator<number, string> {
	const sha256Stream = createHash("sha256");
	const size = buffer instanceof Blob ? buffer.size : buffer.byteLength;
	let done = 0;
	const readable =
		buffer instanceof Blob ? Readable.fromWeb(buffer.stream() as ReadableStream) : Readable.from(Buffer.from(buffer));

	for await (const buffer of readable) {
		sha256Stream.update(buffer);
		done += buffer.length;
		yield done / size;
	}

	return sha256Stream.digest("hex");
}
