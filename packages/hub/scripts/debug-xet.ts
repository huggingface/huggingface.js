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
 * It takes one or more local files, repo, and token, then uploads while saving:
 * - Dedup shards as dedup_[chunk_hash]_shard.bin
 * - Uploaded xorbs as uploaded_xorb_1.bin, uploaded_xorb_2.bin, etc.
 * - Uploaded shards as uploaded_shard_1.bin, uploaded_shard_2.bin, etc.
 *
 * Normal mode: Captures all upload data to upload_[filename]/ directory (single file) or multiple-files/ directory (multiple files)
 * Replay mode: Validates upload data matches previously captured local files
 *
 * Usage:
 * Single file:
 * pnpm --filter hub debug-xet -f <local_file> -t <write_token> -r <xet_repo>
 * pnpm --filter hub debug-xet -f <local_file> -t <write_token> -r <xet_repo> --replay
 *
 * Multiple files (comma-separated):
 * pnpm --filter hub debug-xet -f <file1,file2,file3> -t <write_token> -r <xet_repo>
 * pnpm --filter hub debug-xet -f <file1,file2,file3> -t <write_token> -r <xet_repo> --replay
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
					console.log(`✅ Xorb validation passed: ${xorbFilename} - xorb file is the same as generated previously`);
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
					if (localData.length !== uploadData.length) {
						console.error(`❌ Shard data mismatch: ${shardFilename}`);
						console.error(`   Local size: ${localData.length}, Upload size: ${uploadData.length}`);
						throw new Error(`Shard validation failed for ${shardFilename}`);
					}

					// Compare all bytes except footer bytes 104-112 (9 bytes from positions 104-112 inclusive)
					const footerStart = Number(
						new DataView(localData.buffer).getBigUint64(localData.buffer.byteLength - 8, true)
					);
					// This is the shard timestamp
					const toIgnoreStart = footerStart + 104;
					const toIgnoreEnd = footerStart + 112;

					const mismatch = localData.some((byte, i) => {
						if (i >= toIgnoreStart && i < toIgnoreEnd) {
							return false;
						}
						return byte !== uploadData[i];
					});

					if (mismatch) {
						console.error(`❌ Shard data mismatch: ${shardFilename}`);
						console.error(`   Local size: ${localData.length}, Upload size: ${uploadData.length}`);
						throw new Error(`Shard validation failed for ${shardFilename}`);
					}
					console.log(`✅ Shard validation passed: ${shardFilename} - shard file is the same as generated previously`);

					// Do not mock the shard call
					//return new Response(null, { status: 200 });
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

async function* createMultiFileSource(filepaths: string[]): AsyncGenerator<{
	content: Blob;
	path: string;
	sha256: string;
}> {
	for (const filepath of filepaths) {
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
		console.error("Usage: pnpm --filter hub debug-xet -f <file1,file2,file3> -t <write_token> -r <xet_repo>");
		console.error("Example: pnpm --filter hub debug-xet -f ./model.bin -t hf_... -r myuser/myrepo");
		console.error("Example: pnpm --filter hub debug-xet -f ./model1.bin,./model2.bin -t hf_... -r myuser/myrepo");
		console.error("Options:");
		console.error("  --replay    Use local dedup info instead of remote");
		process.exit(1);
	}

	// Parse comma-separated file paths
	const filePaths = args.file.split(",").map((f) => f.trim());

	// Validate all files exist
	for (const filePath of filePaths) {
		if (!existsSync(filePath)) {
			console.error(`❌ File ${filePath} does not exist`);
			process.exit(1);
		}
	}

	// Determine debug directory name
	const debugDir = filePaths.length > 1 ? "multiple-files" : `upload_${basename(filePaths[0])}`;

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
	};

	console.log(
		`\n=== Starting debug upload for ${filePaths.length > 1 ? `${filePaths.length} files` : basename(filePaths[0])} ===`
	);
	if (args.replay) {
		console.log("🔄 Replay mode: Using local dedup info when available");
	}

	// Get total file stats
	let totalSize = 0;
	for (const filePath of filePaths) {
		const fileStats = await stat(filePath);
		totalSize += fileStats.size;
		console.log(`📄 ${basename(filePath)}: ${(fileStats.size / 1_000_000).toFixed(2)} MB`);
	}
	console.log(`📊 Total size: ${(totalSize / 1_000_000).toFixed(2)} MB`);

	// Process files through uploadShards
	const fileSource = createMultiFileSource(filePaths);

	const processedFiles: Array<{
		path: string;
		sha256: string;
		dedupRatio: number;
	}> = [];

	for await (const event of uploadShards(fileSource, uploadParams)) {
		switch (event.event) {
			case "file": {
				console.log(`\n✅ Upload completed for: ${event.path}`);
				console.log(`   SHA256: ${event.sha256}`);
				console.log(`   Dedup ratio: ${(event.dedupRatio * 100).toFixed(2)}%`);

				processedFiles.push({
					path: event.path,
					sha256: event.sha256,
					dedupRatio: event.dedupRatio,
				});
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
	console.log(`📄 Processed files: ${processedFiles.length}`);
	console.log(`📊 Total size: ${(totalSize / 1024 / 1024).toFixed(2)} MB`);

	// Show details for each file
	for (const file of processedFiles) {
		console.log(`\n🔒 ${file.path}:`);
		console.log(`   SHA256: ${file.sha256}`);
		console.log(`   Deduplication: ${(file.dedupRatio * 100).toFixed(2)}%`);
	}

	// Calculate average dedup ratio
	const avgDedupRatio =
		processedFiles.length > 0 ? processedFiles.reduce((sum, f) => sum + f.dedupRatio, 0) / processedFiles.length : 0;

	console.log(`\n📊 Average deduplication: ${(avgDedupRatio * 100).toFixed(2)}%`);
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
