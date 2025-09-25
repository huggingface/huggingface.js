import { uploadShards } from "../src/utils/uploadShards.js";
import { sha256 } from "../src/utils/sha256.js";
import { parseArgs } from "node:util";
import { tmpdir } from "node:os";
import path, { join } from "node:path";
import { writeFile, readFile, stat, mkdir } from "node:fs/promises";
import type { RepoId } from "../src/types/public.js";
import { toRepoId } from "../src/utils/toRepoId.js";
import type { CommitOperation } from "../src/index.js";
import { commitIter, downloadFile } from "../src/index.js";
import { SplicedBlob } from "../src/utils/SplicedBlob.js";
import { pathToFileURL } from "node:url";
import { existsSync } from "node:fs";
import { FileBlob } from "../src/utils/FileBlob.js";

/**
 * This script downloads the files from openai-community/gpt2 and simulates an upload to a xet repo.
 * It prints the dedup % and the statistics
 *
 * Usage:
 *
 * pnpm --filter hub bench -t <write token> -r <xet repo>
 * pnpm --filter hub bench -t <write token> -r <xet repo> --commit # Actually upload files
 */

const FILES_TO_DOWNLOAD = [
	{
		url: "https://huggingface.co/openai-community/gpt2/resolve/main/64-8bits.tflite?download=true",
		filename: "64-8bits.tflite",
		sha256: "c966da3b74697803352ca7c6f2f220e7090a557b619de9da0c6b34d89f7825c1",
	},
	{
		url: "https://huggingface.co/openai-community/gpt2/resolve/main/64-fp16.tflite?download=true",
		filename: "64-fp16.tflite",
		sha256: "1ceafd82e733dd4b21570b2a86cf27556a983041806c033a55d086e0ed782cd3",
	},
	{
		url: "https://huggingface.co/openai-community/gpt2/resolve/main/64.tflite?download=true",
		filename: "64.tflite",
		sha256: "cfcd510b239d90b71ee87d4e57a5a8c2d55b2a941e5d9fe5852298268ddbe61b",
	},
	{
		url: "https://huggingface.co/openai-community/gpt2/resolve/main/model.safetensors?download=true",
		filename: "model.safetensors",
		sha256: "248dfc3911869ec493c76e65bf2fcf7f615828b0254c12b473182f0f81d3a707",
	},
];

const FILES_TO_EDIT = [
	{
		url: "https://huggingface.co/openai-community/gpt2/resolve/main/64-8bits.tflite?download=true",
		filename: "64-8bits.tflite.edited",
		sha256: "c2b116ccc9e5362d55dd60b344a4b93156594feeef312b5b8833151f0732aa0a",
		edits: [
			{
				start: 0,
				end: 1000,
				content: new Blob([
					"Adding a new prefix to this TFLite file. Will xet still be efficient in deduplicating the file?",
				]),
			},
		],
	},
];

async function downloadFileIfNotExists(url: string, filepath: string): Promise<void> {
	try {
		await stat(filepath);
		console.log(`File ${filepath} already exists, skipping download`);
		return;
	} catch {
		// File doesn't exist, proceed with download
	}

	console.log(`Downloading ${url} to ${filepath}...`);
	const response = await fetch(url);
	if (!response.ok) {
		throw new Error(`Failed to download ${url}: ${response.status} ${response.statusText}`);
	}

	const buffer = await response.arrayBuffer();
	await writeFile(filepath, new Uint8Array(buffer));
	console.log(`Downloaded ${filepath} (${buffer.byteLength} bytes)`);
}

async function* createFileSource(files: Array<{ filepath: string; filename: string }>): AsyncGenerator<{
	content: Blob;
	path: string;
	sha256: string;
	edits?: Array<{ start: number; end: number; content: Blob }>;
}> {
	for (const file of files) {
		console.log(`Processing ${file.filename}...`);
		let blob: Blob = await FileBlob.create(file.filepath);

		if (file.filename.endsWith(".edited")) {
			const edits = FILES_TO_EDIT.find((f) => f.filename === file.filename)?.edits;
			if (edits !== undefined) {
				for (const edit of edits) {
					blob = SplicedBlob.create(blob, [{ insert: edit.content, start: edit.start, end: edit.end }]);
				}
			}
		}

		// Calculate sha256
		console.log(`Calculating SHA256 for ${file.filename}...`);
		const sha256Iterator = sha256(blob, { useWebWorker: false });
		let res: IteratorResult<number, string>;
		do {
			res = await sha256Iterator.next();
		} while (!res.done);
		const sha256Hash = res.value;

		console.log(`SHA256 for ${file.filename}: ${sha256Hash}`);

		const sha256ToCheck =
			FILES_TO_DOWNLOAD.find((f) => f.filename === file.filename)?.sha256 ||
			FILES_TO_EDIT.find((f) => f.filename === file.filename)?.sha256;
		if (sha256ToCheck !== undefined && sha256Hash !== sha256ToCheck) {
			throw new Error(`SHA256 mismatch for ${file.filename}: ${sha256Hash} !== ${sha256ToCheck}`);
		}

		yield {
			content: blob,
			path: file.filename,
			sha256: sha256Hash,
		};
	}
}

function getBodySize(body: RequestInit["body"]): string {
	if (!body) {
		return "no body";
	}
	if (body instanceof ArrayBuffer) {
		return body.byteLength.toString();
	}
	if (body instanceof Blob) {
		return "blob";
	}
	if (body instanceof Uint8Array) {
		return body.byteLength.toString();
	}
	return "unknown size";
}

function createMockFetch(args: { write: boolean }): {
	fetch: typeof fetch;
	getStats: () => { xorbCount: number; shardCount: number; xorbBytes: number; shardBytes: number };
} {
	let xorbCount = 0;
	let shardCount = 0;
	let xorbBytes = 0;
	let shardBytes = 0;

	const mockFetch = async function (input: string | URL | Request, init?: RequestInit): Promise<Response> {
		const url = typeof input === "string" ? input : input.toString();

		// Mock successful responses for xorb and shard uploads
		if (url.includes("/xorbs/")) {
			xorbCount++;
			const bodySize = getBodySize(init?.body);
			xorbBytes += parseInt(bodySize);
			console.log(`[MOCK] Xorb upload ${xorbCount}: ${init?.method || "GET"} ${url} (${bodySize})`);

			if (args.write) {
				// Write the body to a file
				await writeFile("xorb.bin", init?.body as Uint8Array);
			}

			return new Response(null, {
				status: 200,
				statusText: "OK",
			});
		}

		if (url.endsWith("/shards")) {
			shardCount++;
			const bodySize = getBodySize(init?.body);
			shardBytes += parseInt(bodySize);
			console.log(`[MOCK] Shard upload ${shardCount}: ${init?.method || "GET"} ${url} (${bodySize})`);

			if (args.write) {
				// Write the body to a file
				await writeFile("shard.bin", init?.body as Uint8Array);
			}

			return new Response(null, {
				status: 200,
				statusText: "OK",
			});
		}

		// For other requests, use real fetch
		return fetch(input, init).then((res) => {
			console.log(`[real] ${res.status} ${res.statusText} ${url} ${res.headers.get("content-length")}`);
			return res;
		});
	};

	return {
		fetch: mockFetch,
		getStats: () => ({ xorbCount, shardCount, xorbBytes, shardBytes }),
	};
}

async function main() {
	const { values: args } = parseArgs({
		options: {
			token: {
				type: "string",
				short: "t",
			},
			repo: {
				type: "string",
				short: "r",
			},
			commit: {
				type: "boolean",
				short: "c",
				default: false,
			},
			localFilePath: {
				type: "string",
				short: "f",
			},
			write: {
				type: "boolean",
				short: "w",
				default: false,
			},
		},
	});

	if (!args.token || !args.repo) {
		console.error("Usage: pnpm --filter hub bench -t <write token> -r <xet repo>");
		console.error("Example: pnpm --filter hub bench -t hf_... -r myuser/myrepo");
		process.exit(1);
	}

	// Setup temp directory
	const tempDir = tmpdir();
	const downloadDir = join(tempDir, "hf-bench-downloads");

	// Ensure download directory exists
	await mkdir(downloadDir, { recursive: true });

	// Download files
	const files: Array<{ filepath: string; filename: string }> = [];

	for (const fileInfo of FILES_TO_DOWNLOAD) {
		const filepath = join(downloadDir, fileInfo.filename);
		await downloadFileIfNotExists(fileInfo.url, filepath);
		files.push({ filepath, filename: fileInfo.filename });
	}

	for (const fileInfo of FILES_TO_EDIT) {
		const filepath = join(downloadDir, fileInfo.filename);
		await downloadFileIfNotExists(fileInfo.url, filepath);
		files.push({ filepath, filename: fileInfo.filename });
	}

	if (args.localFilePath) {
		if (!existsSync(args.localFilePath)) {
			throw new Error(`Local file ${args.localFilePath} does not exist`);
		}
		files.push({ filepath: args.localFilePath, filename: path.basename(args.localFilePath) });
	}

	// Parse repo
	const repoName = args.repo;

	const repo: RepoId = toRepoId(repoName);

	// Create mock fetch
	const mockFetchObj = createMockFetch({ write: args.write });

	// Setup upload parameters
	const uploadParams = {
		accessToken: args.token,
		hubUrl: "https://huggingface.co",
		fetch: mockFetchObj.fetch,
		repo,
		rev: "main",
	};

	// Track statistics
	const stats: Array<{
		filename: string;
		size: number;
		dedupRatio: number;
	}> = [];

	console.log("\n=== Starting upload simulation ===");

	// Process files through uploadShards
	const fileSource = createFileSource(files);

	const fileProgress: Record<string, number> = {};

	for await (const event of uploadShards(fileSource, {
		...uploadParams,
		yieldCallback: (event) => {
			if (!fileProgress[event.path]) {
				fileProgress[event.path] = event.progress;
			}
			if (event.progress < fileProgress[event.path]) {
				throw new Error(`Progress for ${event.path} went down from ${fileProgress[event.path]} to ${event.progress}`);
			}
			fileProgress[event.path] = event.progress;
		},
	})) {
		switch (event.event) {
			case "file": {
				console.log(`\n📁 Processed file: ${event.path}`);
				console.log(`   SHA256: ${event.sha256}`);
				console.log(`   Dedup ratio: ${(event.dedupRatio * 100).toFixed(2)}%`);

				// Find the file size
				const file = files.find((f) => f.filename === event.path);
				if (file) {
					const fileStats = await stat(file.filepath);

					stats.push({
						filename: event.path,
						size: fileStats.size,
						dedupRatio: event.dedupRatio,
					});
				}
				break;
			}

			case "fileProgress": {
				const progress = (event.progress * 100).toFixed(1);
				console.log(`   📈 Progress for ${event.path}: ${progress}%`);

				if (!fileProgress[event.path]) {
					fileProgress[event.path] = event.progress;
				}
				if (event.progress < fileProgress[event.path]) {
					throw new Error(`Progress for ${event.path} went down from ${fileProgress[event.path]} to ${event.progress}`);
				}
				fileProgress[event.path] = event.progress;
				break;
			}
		}
	}

	// Get actual upload counts from the mock fetch
	const uploadStats = mockFetchObj.getStats();
	console.log(`\n📊 Actual upload counts: ${uploadStats.xorbCount} xorbs, ${uploadStats.shardCount} shards`);

	// Output final statistics
	console.log("\n=== BENCHMARK RESULTS ===");
	console.log("File Statistics:");
	console.log("================");

	for (const stat of stats) {
		console.log(`\n📄 ${stat.filename}:`);
		console.log(`   Size: ${(stat.size / 1024 / 1024).toFixed(2)} MB`);
		console.log(`   Deduplication: ${(stat.dedupRatio * 100).toFixed(2)}%`);
	}

	console.log("\n=== SUMMARY ===");
	const totalSize = stats.reduce((sum, s) => sum + s.size, 0);
	const avgDedup = stats.reduce((sum, s) => sum + s.dedupRatio, 0) / stats.length;

	console.log(`Total files: ${stats.length}`);
	console.log(`Total size: ${(totalSize / 1024 / 1024).toFixed(2)} MB`);
	console.log(`Total xorbs: ${uploadStats.xorbCount}`);
	console.log(`Total shards: ${uploadStats.shardCount}`);
	console.log(`Total xorb bytes: ${uploadStats.xorbBytes.toLocaleString("fr")} bytes`);
	console.log(`Total shard bytes: ${uploadStats.shardBytes.toLocaleString("fr")} bytes`);
	console.log(`Average deduplication: ${(avgDedup * 100).toFixed(2)}%`);

	if (args.commit) {
		console.log("\n=== Committing files ===");
		const operations: CommitOperation[] = [];
		for (const fileInfo of FILES_TO_DOWNLOAD) {
			operations.push({
				operation: "addOrUpdate",
				content: pathToFileURL(join(downloadDir, fileInfo.filename)),
				path: fileInfo.filename,
			});
		}
		for (const fileInfo of FILES_TO_EDIT) {
			operations.push({
				operation: "edit",
				originalContent: new Blob([await readFile(join(downloadDir, fileInfo.filename))]),
				edits: fileInfo.edits,
				path: fileInfo.filename,
			});
		}
		const iterator = commitIter({
			repo,
			operations,
			accessToken: args.token,
			title: "Upload xet files with JS lib",
			useXet: true,
		});
		for await (const event of iterator) {
			if (event.event === "fileProgress" && event.state === "hashing") {
				// We don't care about the hashing progress
			} else {
				console.log(event);
			}
		}

		console.log("Done committing");

		console.log("Redownloading files and verifying SHA256 integrity");
		for (const file of FILES_TO_DOWNLOAD) {
			const fileBlob = await downloadFile({
				repo,
				path: file.filename,
				accessToken: args.token,
			});

			if (!fileBlob) {
				throw new Error(`Failed to download ${file.filename}`);
			}

			const sha256Hash = sha256(fileBlob, { useWebWorker: false });
			let res: IteratorResult<number, string>;
			do {
				res = await sha256Hash.next();
			} while (!res.done);
			const finalHash = res.value;

			console.log(`${file.filename}: ${finalHash} === ${file.sha256} ${finalHash === file.sha256 ? "✅" : "❌"}`);
		}

		for (const file of FILES_TO_EDIT) {
			const fileBlob = await downloadFile({
				repo,
				path: file.filename,
				accessToken: args.token,
			});

			if (!fileBlob) {
				throw new Error(`Failed to download ${file.filename}`);
			}

			const sha256Hash = sha256(fileBlob, { useWebWorker: false });
			let res: IteratorResult<number, string>;
			do {
				res = await sha256Hash.next();
			} while (!res.done);
			const finalHash = res.value;
			console.log(`${file.filename}: ${finalHash} === ${file.sha256} ${finalHash === file.sha256 ? "✅" : "❌"}`);
		}
	}
}

main().catch((error) => {
	console.error("Error:", error);
	process.exit(1);
});
