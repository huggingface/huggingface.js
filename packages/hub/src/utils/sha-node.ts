import { Readable } from "node:stream";
import type { ReadableStream } from "node:stream/web";
import { createHash } from "node:crypto";

export async function* sha256Node(
	buffer: ArrayBuffer | Blob,
	opts?: {
		abortSignal?: AbortSignal;
	}
): AsyncGenerator<number, string> {
	return yield* shaNode("sha256", buffer, opts);
}

export async function* sha1Node(
	buffer: ArrayBuffer | Blob,
	opts?: {
		abortSignal?: AbortSignal;
	}
): AsyncGenerator<number, string> {
	return yield* shaNode("sha1", buffer, opts);
}

async function* shaNode(
	algorithm: "sha1" | "sha256",
	buffer: ArrayBuffer | Blob,
	opts?: {
		abortSignal?: AbortSignal;
	}
): AsyncGenerator<number, string> {
	const sha256Stream = createHash(algorithm);
	const size = buffer instanceof Blob ? buffer.size : buffer.byteLength;
	let done = 0;
	const readable =
		buffer instanceof Blob ? Readable.fromWeb(buffer.stream() as ReadableStream) : Readable.from(Buffer.from(buffer));

	for await (const buffer of readable) {
		sha256Stream.update(buffer);
		done += buffer.length;
		yield done / size;

		opts?.abortSignal?.throwIfAborted();
	}

	return sha256Stream.digest("hex");
}
