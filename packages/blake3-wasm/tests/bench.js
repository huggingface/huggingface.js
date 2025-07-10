/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import { blake3, createHasher, update, finalize } from "../build/release.js";

// Generate random data of specified size
function generateRandomData(size) {
	const data = new Uint8Array(size);
	for (let i = 0; i < size; i++) {
		data[i] = Math.floor(Math.random() * 256);
	}
	return data;
}

// Convert bytes to MB
function bytesToMB(bytes) {
	return bytes / (1000 * 1000);
}

// Format time in appropriate units
function formatTime(ms) {
	if (ms < 1) {
		return `${(ms * 1000).toFixed(2)}μs`;
	} else if (ms < 1000) {
		return `${ms.toFixed(2)}ms`;
	} else {
		return `${(ms / 1000).toFixed(2)}s`;
	}
}

// Format throughput in appropriate units
function formatThroughput(mbPerSec) {
	if (mbPerSec >= 1000) {
		return `${(mbPerSec / 1000).toFixed(2)} GB/s`;
	} else {
		return `${mbPerSec.toFixed(2)} MB/s`;
	}
}

// Benchmark a single data size
function benchmarkSize(dataSize, iterations = 10) {
	const data = generateRandomData(dataSize);
	const totalBytes = dataSize * iterations;

	console.log(
		`\n📊 Benchmarking ${formatBytes(dataSize)} data (${iterations} iterations, ${formatBytes(totalBytes)} total)`
	);
	console.log("─".repeat(60));

	// Warm up
	for (let i = 0; i < 3; i++) {
		blake3(data);
	}

	// Test 1: Single-shot hashing
	const start1 = performance.now();
	for (let i = 0; i < iterations; i++) {
		blake3(data);
	}
	const end1 = performance.now();
	const time1 = end1 - start1;
	const throughput1 = bytesToMB(totalBytes) / (time1 / 1000);

	console.log(`🔹 Single-shot: ${formatTime(time1)} (${formatThroughput(throughput1)})`);

	// Test 2: Streaming hashing with hasher
	const start2 = performance.now();
	for (let i = 0; i < iterations; i++) {
		const hasher = createHasher();
		update(hasher, data);
		finalize(hasher);
	}
	const end2 = performance.now();
	const time2 = end2 - start2;
	const throughput2 = bytesToMB(totalBytes) / (time2 / 1000);

	console.log(`🔹 Streaming:  ${formatTime(time2)} (${formatThroughput(throughput2)})`);

	// Test 3: Chunked hashing (simulate large files)
	const chunkSize = Math.min(64 * 1000, dataSize); // 64KB chunks or data size, whichever is smaller
	const start3 = performance.now();
	for (let i = 0; i < iterations; i++) {
		const hasher = createHasher();
		let offset = 0;
		while (offset < dataSize) {
			const chunk = data.slice(offset, offset + chunkSize);
			update(hasher, chunk);
			offset += chunkSize;
		}
		finalize(hasher);
	}
	const end3 = performance.now();
	const time3 = end3 - start3;
	const throughput3 = bytesToMB(totalBytes) / (time3 / 1000);

	console.log(`🔹 Chunked:    ${formatTime(time3)} (${formatThroughput(throughput3)})`);

	return {
		dataSize,
		iterations,
		totalBytes,
		singleShot: { time: time1, throughput: throughput1 },
		streaming: { time: time2, throughput: throughput2 },
		chunked: { time: time3, throughput: throughput3 },
	};
}

// Format bytes in human readable format
function formatBytes(bytes) {
	if (bytes < 1000) {
		return `${bytes} B`;
	} else if (bytes < 1000 * 1000) {
		return `${(bytes / 1000).toFixed(1)} KB`;
	} else if (bytes < 1000 * 1000 * 1000) {
		return `${(bytes / (1000 * 1000)).toFixed(1)} MB`;
	} else {
		return `${(bytes / (1000 * 1000 * 1000)).toFixed(1)} GB`;
	}
}

// Main benchmark function
function runBenchmark() {
	console.log("🚀 BLAKE3 Performance Benchmark");
	console.log("=".repeat(60));

	const sizes = [
		1000, // 1 KB
		64 * 1000, // 64 KB
		// 1000 * 1000, // 1 MB
		// 10 * 1000 * 1000, // 10 MB
		// 100 * 1000 * 1000, // 100 MB
	];

	const results = [];

	for (const size of sizes) {
		const iterations = size < 1000 * 1000 ? 100 : size < 10 * 1000 * 1000 ? 10 : 3;
		const result = benchmarkSize(size, iterations);
		results.push(result);
	}

	// Summary
	console.log("\n📈 SUMMARY");
	console.log("=".repeat(60));
	console.log("Data Size    | Single-shot | Streaming  | Chunked");
	console.log("─".repeat(60));

	for (const result of results) {
		const size = formatBytes(result.dataSize).padEnd(12);
		const single = formatThroughput(result.singleShot.throughput).padEnd(12);
		const stream = formatThroughput(result.streaming.throughput).padEnd(12);
		const chunk = formatThroughput(result.chunked.throughput);

		console.log(`${size} | ${single} | ${stream} | ${chunk}`);
	}

	// Find best performance
	let bestThroughput = 0;
	let bestMethod = "";
	let bestSize = "";

	for (const result of results) {
		const methods = [
			{ name: "Single-shot", throughput: result.singleShot.throughput },
			{ name: "Streaming", throughput: result.streaming.throughput },
			{ name: "Chunked", throughput: result.chunked.throughput },
		];

		for (const method of methods) {
			if (method.throughput > bestThroughput) {
				bestThroughput = method.throughput;
				bestMethod = method.name;
				bestSize = formatBytes(result.dataSize);
			}
		}
	}

	console.log("\n🏆 BEST PERFORMANCE");
	console.log("─".repeat(60));
	console.log(`Method: ${bestMethod}`);
	console.log(`Data Size: ${bestSize}`);
	console.log(`Throughput: ${formatThroughput(bestThroughput)}`);

	return results;
}

// Run the benchmark if this file is executed directly
if (typeof window === "undefined") {
	runBenchmark();
}

export { runBenchmark, benchmarkSize, generateRandomData };
