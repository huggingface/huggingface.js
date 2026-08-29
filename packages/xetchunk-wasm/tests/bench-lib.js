/**
 * Shared helpers for the xetchunk-wasm bench scripts.
 */
import { createReadStream } from "node:fs";

/** Deterministic xorshift128 PRNG — fast, reproducible "random" data. */
export function fillRandom(data, seed = 0x9e3779b9) {
	let x = seed | 0 || 1,
		y = 0x243f6a88,
		z = 0xb7e15162,
		w = 0xdeadbeef;
	const words = new Uint32Array(data.buffer, data.byteOffset, data.byteLength >>> 2);
	for (let i = 0; i < words.length; i++) {
		const t = x ^ (x << 11);
		x = y;
		y = z;
		z = w;
		w = (w ^ (w >>> 19) ^ (t ^ (t >>> 8))) | 0;
		words[i] = w;
	}
	for (let i = words.length * 4; i < data.length; i++) {
		data[i] = i & 0xff;
	}
	return data;
}

/** Text-like data: repetitive words with slight periodic variation. */
export function fillTextLike(data) {
	const base =
		"The quick brown fox jumps over the lazy dog. Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore. ";
	const bytes = new TextEncoder().encode(base);
	for (let i = 0; i < data.length; i++) {
		// Repeat the phrase, mutate one byte per "paragraph" so it isn't pure repetition
		const b = bytes[i % bytes.length];
		data[i] = i % 4093 === 0 ? (b + ((i / 4093) & 0x3f)) & 0xff : b;
	}
	return data;
}

export function makeData(kind, bytes) {
	const data = new Uint8Array(bytes);
	switch (kind) {
		case "random":
			return fillRandom(data);
		case "zeros":
			return data;
		case "text":
			return fillTextLike(data);
		default:
			throw new Error(`unknown data kind: ${kind}`);
	}
}

/** Load the first `bytes` bytes of a file into memory, repeating if too short. */
export async function loadFile(path, bytes) {
	const data = new Uint8Array(bytes);
	const stream = createReadStream(path);
	let totalRead = 0;

	for await (const chunk of stream) {
		data.set(chunk.subarray(0, data.length - totalRead), totalRead);
		totalRead += chunk.length;
		if (totalRead >= data.length) {
			stream.close();
			break;
		}
	}

	if (totalRead < data.length && totalRead > 0) {
		while (totalRead < data.length) {
			const n = Math.min(totalRead, data.length - totalRead);
			data.set(data.subarray(0, n), totalRead);
			totalRead += n;
		}
	}
	return data;
}

/**
 * Run `fn` for `rounds` timed rounds (plus `warmup` untimed) and return
 * { medianMs, bestMs, worstMs, mbps } where mbps is based on the median.
 */
export function bench(fn, bytes, { rounds = 5, warmup = 1 } = {}) {
	for (let i = 0; i < warmup; i++) fn();
	const times = [];
	for (let r = 0; r < rounds; r++) {
		const start = performance.now();
		fn();
		times.push(performance.now() - start);
	}
	times.sort((a, b) => a - b);
	const medianMs = times[Math.floor(times.length / 2)];
	return {
		medianMs,
		bestMs: times[0],
		worstMs: times[times.length - 1],
		mbps: bytes / 1_000_000 / (medianMs / 1000),
	};
}

/**
 * Bench several functions with interleaved (round-robin) rounds so that
 * machine-load drift over time affects all of them equally — important when
 * comparing stages against each other or subtracting one from another.
 * Returns an array of { medianMs, bestMs, worstMs, mbps } in input order.
 */
export function benchAll(fns, bytes, { rounds = 5, warmup = 1 } = {}) {
	for (let i = 0; i < warmup; i++) for (const fn of fns) fn();
	const times = fns.map(() => []);
	for (let r = 0; r < rounds; r++) {
		for (let i = 0; i < fns.length; i++) {
			const start = performance.now();
			fns[i]();
			times[i].push(performance.now() - start);
		}
	}
	return times.map((t) => {
		t.sort((a, b) => a - b);
		const medianMs = t[Math.floor(t.length / 2)];
		return {
			medianMs,
			bestMs: t[0],
			worstMs: t[t.length - 1],
			mbps: bytes / 1_000_000 / (medianMs / 1000),
		};
	});
}

/** Suppress the vendored Rust wasm's debug console.log during `fn`. */
export function silenced(fn) {
	return () => {
		const log = console.log;
		console.log = () => {};
		try {
			return fn();
		} finally {
			console.log = log;
		}
	};
}

export function fmtMBps(mbps) {
	return mbps >= 995 ? `${(mbps / 1000).toFixed(2)} GB/s` : `${mbps.toFixed(0)} MB/s`;
}

export function fmtSize(bytes) {
	if (bytes % (1024 * 1024) === 0) return `${bytes / (1024 * 1024)}MB`;
	if (bytes % 1024 === 0) return `${bytes / 1024}KB`;
	return `${bytes}B`;
}
