import { uploadShards } from "../src/utils/uploadShards.js";
import { sha256 } from "../src/utils/sha256.js";
import { parseArgs } from "node:util";
import { join, basename } from "node:path";
import { writeFile, readFile, stat, mkdir, readdir } from "node:fs/promises";
import type { RepoId } from "../src/types/public.js";
import { toRepoId } from "../src/utils/toRepoId.js";
import { FileBlob } from "../src/utils/FileBlob.js";
import { existsSync } from "node:fs";

/**
 * This script debugs xet uploads by capturing all network data locally
 * It takes a local file, repo, and token, then uploads while saving:
 * - Dedup shards as dedup_[chunk_hash]_shard.bin
 * - Uploaded xorbs as uploaded_xorb_1.bin, uploaded_xorb_2.bin, etc.
 * - Uploaded shards as uploaded_shard_1.bin, uploaded_shard_2.bin, etc.
 *
 * Normal mode: Captures all upload data to upload_[filename]/ directory
 * Replay mode: Validates upload data matches previously captured local files
 *
 * Usage:
 * pnpm --filter hub debug-xet -f <local_file> -t <write_token> -r <xet_repo>
 * pnpm --filter hub debug-xet -f <local_file> -t <write_token> -r <xet_repo> --replay
 */

interface DebugFetchStats {
	xorbCount: number;
	shardCount: number;
	dedupShardCount: number;
}

function createDebugFetch(args: { debugDir: string; replay?: boolean }): {
	fetch: typeof fetch;
	getStats: () => DebugFetchStats;
} {
	let xorbCount = 0;
	let shardCount = 0;
	let dedupShardCount = 0;

	const debugFetch = async function (input: string | URL | Request, init?: RequestInit): Promise<Response> {
		const url = typeof input === "string" ? input : input.toString();

		// Handle xorb uploads - capture the xorb data
		if (url.includes("/xorbs/")) {
			xorbCount++;
			const xorbFilename = `uploaded_xorb_${xorbCount}.bin`;
			const xorbPath = join(args.debugDir, xorbFilename);

			if (init?.body) {
				const uploadData = init.body as Uint8Array;

				if (args.replay) {
					// In replay mode, compare with existing local file

					const localData = await readFile(xorbPath);
					if (localData.length !== uploadData.length || !localData.every((byte, i) => byte === uploadData[i])) {
						console.error(`❌ Xorb data mismatch: ${xorbFilename}`);
						console.error(`   Local size: ${localData.length}, Upload size: ${uploadData.length}`);
						throw new Error(`Xorb validation failed for ${xorbFilename}`);
					}
					console.log(`✅ Xorb validation passed: ${xorbFilename}`);
					return new Response(null, { status: 200 });
				} else {
					// In normal mode, save the data
					await writeFile(xorbPath, uploadData);
					console.log(`💾 Saved xorb to ${xorbFilename} (${uploadData.length} bytes)`);
				}
			}

			// Forward the real request to backend
			const realResponse = await fetch(input, init);
			console.log(`📤 Xorb upload ${xorbCount}: ${realResponse.status} ${realResponse.statusText}`);
			return realResponse;
		}

		// Handle shard uploads - capture the shard data
		if (url.endsWith("/shards")) {
			shardCount++;
			const shardFilename = `uploaded_shard_${shardCount}.bin`;
			const shardPath = join(args.debugDir, shardFilename);

			if (init?.body) {
				const uploadData = init.body as Uint8Array;

				if (args.replay) {
					// In replay mode, compare with existing local file
					const localData = await readFile(shardPath);
					if (localData.length !== uploadData.length || !localData.every((byte, i) => byte === uploadData[i])) {
						console.error(`❌ Shard data mismatch: ${shardFilename}`);
						console.error(`   Local size: ${localData.length}, Upload size: ${uploadData.length}`);
						throw new Error(`Shard validation failed for ${shardFilename}`);
					}
					console.log(`✅ Shard validation passed: ${shardFilename}`);
					return new Response(null, { status: 200 });
				} else {
					// In normal mode, save the data
					await writeFile(shardPath, uploadData);
					console.log(`💾 Saved shard to ${shardFilename} (${uploadData.length} bytes)`);
				}
			}

			// Forward the real request to backend
			const realResponse = await fetch(input, init);
			console.log(`📤 Shard upload ${shardCount}: ${realResponse.status} ${realResponse.statusText}`);
			return realResponse;
		}

		// Handle dedup info requests - save or replay locally
		if (url.includes("/chunks/")) {
			if (args.replay) {
				// In replay mode, try to load from local files
				const urlParts = url.split("/");
				const chunkHash = urlParts[urlParts.length - 1];
				const dedupFilename = `dedup_${chunkHash}_shard.bin`;
				const dedupPath = join(args.debugDir, dedupFilename);

				try {
					const localData = await readFile(dedupPath);
					console.log(`🔄 Replaying dedup info from ${dedupFilename}`);
					return new Response(localData, { status: 200 });
				} catch (error) {
					return new Response(null, { status: 404 });
				}
			}

			// Forward to real backend and save response
			const realResponse = await fetch(input, init);

			if (realResponse.ok && realResponse.body) {
				const urlParts = url.split("/");
				const chunkHash = urlParts[urlParts.length - 1];
				const dedupFilename = `dedup_${chunkHash}_shard.bin`;
				const dedupPath = join(args.debugDir, dedupFilename);

				const responseData = await realResponse.arrayBuffer();
				await writeFile(dedupPath, new Uint8Array(responseData));

				dedupShardCount++;
				console.log(`💾 Saved dedup info to ${dedupFilename} (${responseData.byteLength} bytes)`);

				// Return a new response with the same data
				return new Response(responseData, {
					status: realResponse.status,
					statusText: realResponse.statusText,
					headers: realResponse.headers,
				});
			}

			return realResponse;
		}

		// For all other requests, use real fetch
		return fetch(input, init);
	};

	return {
		fetch: debugFetch,
		getStats: () => ({ xorbCount, shardCount, dedupShardCount }),
	};
}

async function* createFileSource(filepath: string): AsyncGenerator<{
	content: Blob;
	path: string;
	sha256: string;
}> {
	const filename = basename(filepath);
	console.log(`Processing ${filename}...`);

	const blob: Blob = await FileBlob.create(filepath);

	// Calculate sha256
	console.log(`Calculating SHA256 for ${filename}...`);
	const sha256Iterator = sha256(blob, { useWebWorker: false });
	let res: IteratorResult<number, string>;
	do {
		res = await sha256Iterator.next();
	} while (!res.done);
	const sha256Hash = res.value;

	console.log(`SHA256 for ${filename}: ${sha256Hash}`);

	yield {
		content: blob,
		path: filename,
		sha256: sha256Hash,
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
			file: {
				type: "string",
				short: "f",
			},
			replay: {
				type: "boolean",
				default: false,
			},
		},
	});

	if (!args.token || !args.repo || !args.file) {
		console.error("Usage: pnpm --filter hub debug-xet -f <local_file> -t <write_token> -r <xet_repo>");
		console.error("Example: pnpm --filter hub debug-xet -f ./model.bin -t hf_... -r myuser/myrepo");
		console.error("Options:");
		console.error("  --replay    Use local dedup info instead of remote");
		process.exit(1);
	}

	if (!existsSync(args.file)) {
		console.error(`❌ File ${args.file} does not exist`);
		process.exit(1);
	}

	const filename = basename(args.file);
	const debugDir = `upload_${filename}`;

	// Handle debug directory based on mode
	if (args.replay) {
		// In replay mode, directory must exist
		if (!existsSync(debugDir)) {
			console.error(`❌ Debug directory ${debugDir} does not exist`);
			console.error(`   Run without --replay first to capture upload data`);
			process.exit(1);
		}
		console.log(`📁 Using existing debug directory: ${debugDir}`);
	} else {
		// In normal mode, directory must not exist
		if (existsSync(debugDir)) {
			console.error(`❌ Debug directory ${debugDir} already exists`);
			console.error(`   Please remove it first: rm -rf ${debugDir}`);
			process.exit(1);
		}

		// Create debug directory
		await mkdir(debugDir, { recursive: true });
		console.log(`📁 Created debug directory: ${debugDir}`);
	}

	// Parse repo
	const repo: RepoId = toRepoId(args.repo);

	// Create debug fetch
	const debugFetchObj = createDebugFetch({
		debugDir,
		replay: args.replay,
	});

	// Setup upload parameters
	const uploadParams = {
		accessToken: args.token,
		hubUrl: "https://huggingface.co",
		fetch: debugFetchObj.fetch,
		repo,
		rev: "main",
		yieldCallback: (event: { event: "fileProgress"; path: string; progress: number }) => {
			const progress = (event.progress * 100).toFixed(1);
			console.log(`📈 Progress for ${event.path}: ${progress}%`);
		},
	};

	console.log(`\n=== Starting debug upload for ${filename} ===`);
	if (args.replay) {
		console.log("🔄 Replay mode: Using local dedup info when available");
	}

	// Get file stats
	const fileStats = await stat(args.file);
	console.log(`📄 File size: ${(fileStats.size / 1024 / 1024).toFixed(2)} MB`);

	// Process file through uploadShards
	const fileSource = createFileSource(args.file);

	let dedupRatio = 0;
	let fileSha256 = "";

	for await (const event of uploadShards(fileSource, uploadParams)) {
		switch (event.event) {
			case "file": {
				console.log(`\n✅ Upload completed for: ${event.path}`);
				console.log(`   SHA256: ${event.sha256}`);
				console.log(`   Dedup ratio: ${(event.dedupRatio * 100).toFixed(2)}%`);

				dedupRatio = event.dedupRatio;
				fileSha256 = event.sha256;
				break;
			}

			case "fileProgress": {
				// Progress already logged in yieldCallback
				break;
			}
		}
	}

	// Get final stats from debug fetch
	const stats = debugFetchObj.getStats();

	console.log("\n=== DEBUG UPLOAD RESULTS ===");
	console.log(`📁 Debug directory: ${debugDir}`);
	console.log(`📄 Original file: ${filename} (${(fileStats.size / 1024 / 1024).toFixed(2)} MB)`);
	console.log(`🔒 SHA256: ${fileSha256}`);
	console.log(`📊 Deduplication: ${(dedupRatio * 100).toFixed(2)}%`);
	console.log(`📤 Network calls:`);
	console.log(`   - ${stats.xorbCount} xorb uploads`);
	console.log(`   - ${stats.shardCount} shard uploads`);
	console.log(`   - ${stats.dedupShardCount} dedup info downloads`);

	// List all captured files
	const capturedFiles = await readdir(debugDir);
	console.log(`\n💾 Captured ${capturedFiles.length} files:`);
	for (const file of capturedFiles.sort()) {
		const filePath = join(debugDir, file);
		const fileInfo = await stat(filePath);
		console.log(`   - ${file} (${fileInfo.size.toLocaleString()} bytes)`);
	}

	if (args.replay) {
		console.log(`\n✅ Replay validation completed successfully!`);
		console.log(`   All uploaded data matched local files`);
	} else {
		console.log(`\n🚀 Debug upload completed successfully!`);
		console.log(`   Use --replay flag to test with local dedup data`);
	}
}

main().catch((error) => {
	console.error("❌ Error:", error);
	process.exit(1);
});
