import { createWriteStream } from "node:fs";
import { rename, unlink } from "node:fs/promises";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import type { ReadableStream } from "node:stream/web";

/**
 * Stream a (potentially lazy) Blob to a local file path.
 *
 * @param onProgress called after each chunk with the cumulative number of bytes written so far.
 * Writes to `<filePath>.incomplete` and renames on success, so a failed transfer never touches an existing file.
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

	const incompletePath = `${filePath}.incomplete`;
	try {
		await pipeline(source, createWriteStream(incompletePath));
		await rename(incompletePath, filePath);
	} catch (error) {
		await unlink(incompletePath).catch(() => {});
		throw error;
	}
}

export async function readStdin(): Promise<Buffer> {
	const chunks: Buffer[] = [];
	for await (const chunk of process.stdin) {
		chunks.push(chunk as Buffer);
	}
	return Buffer.concat(chunks);
}
