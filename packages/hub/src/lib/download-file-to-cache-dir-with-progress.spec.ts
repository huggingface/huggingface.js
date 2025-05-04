import { expect, test, describe, beforeAll, afterAll } from "vitest";
import { mkdtemp, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import type { DownloadFileEvent} from "./download-file-to-cache-dir-with-progress";
import { downloadFileToCacheDirWithProgress } from "./download-file-to-cache-dir-with-progress";

describe('downloadFileToCacheDirWithProgress', () => {
	let tempDir: string;
	beforeAll(async () => {
		tempDir = await mkdtemp(join(tmpdir(), 'model-'));
	});

	afterAll(() => {
		return rm(tempDir, { recursive: true });
	});

	test('file should be downloaded with progress', async () => {
		const iterator = downloadFileToCacheDirWithProgress({
			repo: "ggml-org/models",
			path: "bert-bge-small/ggml-model-f16-big-endian.gguf",
			revision: "121397626a3ba7de07c154b4bbac3ac83f5628e0",
			cacheDir: tempDir,
		});

		let res: IteratorResult<DownloadFileEvent, string>;

		do {
			res = await iterator.next();
			if (!res.done) {
				const { path } = res.value;
				expect(path).toBe('bert-bge-small/ggml-model-f16-big-endian.gguf');
			}
		} while (!res.done);

		expect(res.value).toStrictEqual(
			join(tempDir, 'models--ggml-org--models', 'snapshots', '121397626a3ba7de07c154b4bbac3ac83f5628e0', 'bert-bge-small', 'ggml-model-f16-big-endian.gguf'),
		);
	});
});