import { parseArgs } from "node:util";
import { createHash } from "node:crypto";
import { Hasher, hash } from "../dist/esm/index.js";

/**
 * Keyed BLAKE3 throughput benchmark, modelled on the real xet-chunking
 * workload: one long-lived keyed hasher, per message `.reset().update(msg).finalize(32)`.
 *
 * Usage: node test/bench.js [--rounds N] [--crypto]
 *   --crypto  also benchmark node:crypto SHA-256 as a sanity reference
 */

const { values } = parseArgs({
	args: process.argv.slice(2),
	options: {
		rounds: { type: "string", default: "7" },
		crypto: { type: "boolean", default: false },
	},
});

const ROUNDS = Math.max(5, parseInt(values.rounds, 10) || 7);

const KEY = new Uint8Array(32);
for (let i = 0; i < 32; i++) {
	KEY[i] = (i * 47 + 13) & 0xff;
}

// Deterministic pseudo-random data (fast xorshift; content doesn't matter for blake3 speed)
function makeData(size) {
	const data = new Uint8Array(size);
	let x = 0x12345678;
	for (let i = 0; i < size; i++) {
		x ^= x << 13;
		x ^= x >>> 17;
		x ^= x << 5;
		data[i] = x & 0xff;
	}
	return data;
}

function benchOne(label, totalBytes, fn) {
	const times = [];
	// warmup
	fn();
	fn();
	for (let r = 0; r < ROUNDS; r++) {
		const start = performance.now();
		fn();
		times.push(performance.now() - start);
	}
	times.sort((a, b) => a - b);
	const median = times[Math.floor(ROUNDS / 2)];
	const best = times[0];
	const mbps = totalBytes / 1e6 / (median / 1000);
	const mbpsBest = totalBytes / 1e6 / (best / 1000);
	console.log(
		`${label.padEnd(24)} median ${mbps.toFixed(0).padStart(6)} MB/s (best ${mbpsBest.toFixed(0)} MB/s)`
	);
	return mbps;
}

console.log(`keyed BLAKE3 (reset/update/finalize per message), median of ${ROUNDS} rounds\n`);

const SIZES = [
	[1024, "1KB"],
	[8192, "8KB"],
	[16384, "16KB"],
	[65536, "64KB"],
	[131072, "128KB"],
	[1048576, "1MB"],
];

const hasher = Hasher.newKeyed(KEY);
const results = {};

for (const [size, name] of SIZES) {
	const data = makeData(size);
	// enough iterations per round for stable timing (~200MB per round, min 20)
	const iters = Math.max(20, Math.round(200e6 / size));
	results[name] = benchOne(`keyed ${name} x${iters}`, size * iters, () => {
		for (let i = 0; i < iters; i++) {
			hasher.reset().update(data).finalize(32);
		}
	});
}

// The end-to-end shape: 100MB processed as ~64KB chunks
{
	const CHUNK = 65536;
	const TOTAL = 100_000_000;
	const data = makeData(TOTAL);
	results["100MB/64KB"] = benchOne(`keyed 100MB in 64KB`, TOTAL, () => {
		for (let off = 0; off < TOTAL; off += CHUNK) {
			hasher
				.reset()
				.update(data.subarray(off, Math.min(off + CHUNK, TOTAL)))
				.finalize(32);
		}
	});
}

// Unkeyed one-shot hash() for reference
{
	const data = makeData(1048576);
	benchOne(`hash() 1MB unkeyed`, 1048576 * 200, () => {
		for (let i = 0; i < 200; i++) {
			hash(data);
		}
	});
}

if (values.crypto) {
	const data = makeData(65536);
	const iters = 3000;
	benchOne(`sha256 64KB (crypto)`, 65536 * iters, () => {
		for (let i = 0; i < iters; i++) {
			createHash("sha256").update(data).digest();
		}
	});
}

console.log(
	`\nsummary: 64KB ${results["64KB"].toFixed(0)} MB/s | 100MB-in-64KB ${results["100MB/64KB"].toFixed(0)} MB/s`
);
