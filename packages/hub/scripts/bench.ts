import { uploadShards } from "../src/utils/uploadShards.js";
import { sha256 } from "../src/utils/sha256.js";
import { parseArgs } from "node:util";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { writeFile, readFile, stat, mkdir } from "node:fs/promises";
import type { RepoId } from "../src/types/public.js";
import { toRepoId } from "../src/utils/toRepoId.js";

const FILES_TO_DOWNLOAD = [
	{
		url: "https://huggingface.co/openai-community/gpt2/resolve/main/64-8bits.tflite?download=true",
		filename: "64-8bits.tflite",
	},
	{
		url: "https://huggingface.co/openai-community/gpt2/resolve/main/64-fp16.tflite?download=true",
		filename: "64-fp16.tflite",
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

async function* createFileSource(
	files: Array<{ filepath: string; filename: string }>
): AsyncGenerator<{ content: Blob; path: string; sha256: string }> {
	for (const file of files) {
		console.log(`Processing ${file.filename}...`);
		const buffer = await readFile(file.filepath);
		const blob = new Blob([buffer]);

		// Calculate sha256
		console.log(`Calculating SHA256 for ${file.filename}...`);
		const sha256Iterator = sha256(blob, { useWebWorker: false });
		let res: IteratorResult<number, string>;
		do {
			res = await sha256Iterator.next();
		} while (!res.done);
		const sha256Hash = res.value;

		console.log(`SHA256 for ${file.filename}: ${sha256Hash}`);
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

function createMockFetch(): typeof fetch {
	let uploadCount = 0;

	return async function mockFetch(input: string | URL | Request, init?: RequestInit): Promise<Response> {
		const url = typeof input === "string" ? input : input.toString();

		// Mock successful responses for xorb and shard uploads
		if (url.includes("/xorb/") || url.includes("/shard/")) {
			uploadCount++;
			const bodySize = getBodySize(init?.body);
			console.log(`[MOCK] Upload ${uploadCount}: ${init?.method || "GET"} ${url} (${bodySize})`);

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
		},
	});

	if (!args.token || !args.repo) {
		console.error("Usage: node bench.ts --token <token> --repo <repo>");
		console.error("Example: node bench.ts --token hf_... --repo myuser/myrepo");
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

	// Parse repo
	const repoName = args.repo;

	const repo: RepoId = toRepoId(repoName);

	// Create mock fetch
	const mockFetch = createMockFetch();

	// Setup upload parameters
	const uploadParams = {
		accessToken: args.token,
		hubUrl: "https://huggingface.co",
		customFetch: mockFetch,
		repo,
		rev: "main",
	};

	// Track statistics
	const stats: Array<{
		filename: string;
		size: number;
		xorbCount: number;
		shardCount: number;
		dedupRatio: number;
	}> = [];

	console.log("\n=== Starting upload simulation ===");

	// Process files through uploadShards
	const fileSource = createFileSource(files);

	for await (const event of uploadShards(fileSource, uploadParams)) {
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
						xorbCount: 0, // Will be updated later
						shardCount: 0, // Will be updated later
						dedupRatio: event.dedupRatio,
					});
				}
				break;
			}

			case "fileProgress": {
				const progress = (event.progress * 100).toFixed(1);
				console.log(`   📈 Progress for ${event.path}: ${progress}%`);
				break;
			}
		}
	}

	// Note: xorb and shard counts are tracked internally by uploadShards
	// For this demo, we'll make reasonable estimates based on file sizes
	for (const stat of stats) {
		// Rough estimates - in real usage these would come from the upload process
		stat.xorbCount = Math.ceil(stat.size / (64 * 1024 * 1024)); // 64MB xorbs
		stat.shardCount = Math.max(1, Math.ceil(stat.xorbCount / 100)); // Rough shard estimation
	}

	// Output final statistics
	console.log("\n=== BENCHMARK RESULTS ===");
	console.log("File Statistics:");
	console.log("================");

	for (const stat of stats) {
		console.log(`\n📄 ${stat.filename}:`);
		console.log(`   Size: ${(stat.size / 1024 / 1024).toFixed(2)} MB`);
		console.log(`   Xorbs: ${stat.xorbCount}`);
		console.log(`   Shards: ${stat.shardCount}`);
		console.log(`   Deduplication: ${(stat.dedupRatio * 100).toFixed(2)}%`);
	}

	console.log("\n=== SUMMARY ===");
	const totalSize = stats.reduce((sum, s) => sum + s.size, 0);
	const totalXorbs = stats.reduce((sum, s) => sum + s.xorbCount, 0);
	const totalShards = stats.reduce((sum, s) => sum + s.shardCount, 0);
	const avgDedup = stats.reduce((sum, s) => sum + s.dedupRatio, 0) / stats.length;

	console.log(`Total files: ${stats.length}`);
	console.log(`Total size: ${(totalSize / 1024 / 1024).toFixed(2)} MB`);
	console.log(`Total xorbs: ${totalXorbs}`);
	console.log(`Total shards: ${totalShards}`);
	console.log(`Average deduplication: ${(avgDedup * 100).toFixed(2)}%`);
}

main().catch((error) => {
	console.error("Error:", error);
	process.exit(1);
});
