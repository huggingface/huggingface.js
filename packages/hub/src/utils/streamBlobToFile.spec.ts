import { access, mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { streamBlobToFile } from "./streamBlobToFile";

describe("streamBlobToFile", () => {
	let dir: string;

	beforeEach(async () => {
		dir = await mkdtemp(join(tmpdir(), "stream-blob-"));
	});

	afterEach(async () => {
		await rm(dir, { recursive: true, force: true });
	});

	it("writes the exact bytes of the blob to disk", async () => {
		const bytes = new Uint8Array([0, 1, 2, 3, 255, 128, 64]);
		const blob = new Blob([bytes]);
		const dest = join(dir, "out.bin");

		await streamBlobToFile(blob, dest);

		const written = await readFile(dest);
		expect(new Uint8Array(written)).toEqual(bytes);
	});

	it("reports cumulative progress ending at the blob size", async () => {
		const bytes = new Uint8Array(10_000).map((_, i) => i % 256);
		const blob = new Blob([bytes]);
		const dest = join(dir, "out.bin");

		const progress: number[] = [];
		await streamBlobToFile(blob, dest, (bytesWritten) => progress.push(bytesWritten));

		expect(progress.length).toBeGreaterThan(0);
		// Monotonically increasing
		for (let i = 1; i < progress.length; i++) {
			expect(progress[i]).toBeGreaterThan(progress[i - 1]);
		}
		expect(progress[progress.length - 1]).toBe(blob.size);
	});

	it("removes the partial file and rethrows when the stream errors", async () => {
		const dest = join(dir, "out.bin");
		const failing = {
			size: 100,
			stream: () =>
				new ReadableStream({
					start(controller) {
						controller.enqueue(new Uint8Array([1, 2, 3]));
						controller.error(new Error("boom"));
					},
				}),
		} as unknown as Blob;

		await expect(streamBlobToFile(failing, dest)).rejects.toThrow("boom");
		await expect(access(dest)).rejects.toThrow();
	});
});
