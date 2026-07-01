import { createWriteStream } from "node:fs";
import { unlink } from "node:fs/promises";
import { Readable } from "node:stream";
import type { ReadableStream } from "node:stream/web";
import { pipeline } from "node:stream/promises";

/**
 * Stream a (potentially lazy) Blob to a local file path.
 *
 * @param onProgress called after each chunk with the cumulative number of bytes written so far.
 * On error, the partially written file is removed so no truncated file is left behind.
 */
export async function streamBlobToFile(
	blob: Blob,
	filePath: string,
	onProgress?: (bytesWritten: number) => void,
): Promise<void> {
	let bytesWritten = 0;
	const source = Readable.fromWeb(blob.stream() as ReadableStream);

	if (onProgress) {
		source.on("data", (chunk: Buffer) => {
			bytesWritten += chunk.byteLength;
			onProgress(bytesWritten);
		});
	}

	try {
		await pipeline(source, createWriteStream(filePath));
	} catch (error) {
		await unlink(filePath).catch(() => {});
		throw error;
	}
}
