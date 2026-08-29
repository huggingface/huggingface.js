import { describe, it, expect } from "vitest";
import { Hasher, hash, hashInto, createKeyed, createDeriveKey, createHasher, getOneShotContext } from "../src/index.js";
// Official BLAKE3 test vectors from https://github.com/BLAKE3-team/BLAKE3
import * as vectorsJson from "./test-vectors.json";

const vectors = vectorsJson as {
	key: string;
	context_string: string;
	cases: Array<{ input_len: number; hash: string; keyed_hash: string; derive_key: string }>;
};

const KEY = new TextEncoder().encode(vectors.key);

function makeInput(len: number): Uint8Array {
	// Official vectors input: bytes cycle 0,1,...,250,0,1,...
	const input = new Uint8Array(len);
	for (let i = 0; i < len; i++) {
		input[i] = i % 251;
	}
	return input;
}

function toHex(bytes: Uint8Array): string {
	return Array.from(bytes)
		.map((b) => b.toString(16).padStart(2, "0"))
		.join("");
}

describe("official BLAKE3 test vectors", () => {
	for (const testCase of vectors.cases) {
		const input = makeInput(testCase.input_len);
		const extendedLen = testCase.hash.length / 2; // 131 bytes

		it(`hash, input_len=${testCase.input_len}`, () => {
			expect(toHex(hash(input))).toBe(testCase.hash.slice(0, 64));
			expect(toHex(new Hasher().update(input).finalize(32))).toBe(testCase.hash.slice(0, 64));
			// extended (XOF) output
			expect(toHex(new Hasher().update(input).finalize(extendedLen))).toBe(testCase.hash);
			expect(toHex(hash(input, extendedLen))).toBe(testCase.hash);
		});

		it(`keyed_hash, input_len=${testCase.input_len}`, () => {
			expect(toHex(Hasher.newKeyed(KEY).update(input).finalize(32))).toBe(testCase.keyed_hash.slice(0, 64));
			expect(toHex(createKeyed(KEY).update(input).finalize(extendedLen))).toBe(testCase.keyed_hash);
		});

		it(`derive_key, input_len=${testCase.input_len}`, () => {
			expect(toHex(Hasher.newDeriveKey(vectors.context_string).update(input).finalize(32))).toBe(
				testCase.derive_key.slice(0, 64),
			);
			expect(toHex(createDeriveKey(vectors.context_string).update(input).finalize(extendedLen))).toBe(
				testCase.derive_key,
			);
		});
	}
});

describe("streaming updates", () => {
	it("matches one-shot for arbitrary update splits", () => {
		const input = makeInput(102400);
		const expected = toHex(Hasher.newKeyed(KEY).update(input).finalize(32));

		for (const pieceLen of [1, 7, 64, 1000, 1024, 4096, 65536]) {
			const hasher = Hasher.newKeyed(KEY);
			for (let off = 0; off < input.length; off += pieceLen) {
				hasher.update(input.subarray(off, Math.min(off + pieceLen, input.length)));
			}
			expect(toHex(hasher.finalize(32)), `pieceLen=${pieceLen}`).toBe(expected);
		}
	});

	it("handles messages larger than the wasm one-shot staging area", () => {
		// > 4 MiB forces the fallback to the scalar streaming path mid-update
		const big = makeInput(5 * 1024 * 1024 + 17);
		const viaHasher = toHex(new Hasher().update(big).finalize(32));
		const viaBigUpdates = (() => {
			const hasher = new Hasher();
			hasher.update(big.subarray(0, 3 * 1024 * 1024));
			hasher.update(big.subarray(3 * 1024 * 1024));
			return toHex(hasher.finalize(32));
		})();
		const viaOneShotFn = toHex(hash(big));
		expect(viaHasher).toBe(viaOneShotFn);
		expect(viaBigUpdates).toBe(viaOneShotFn);
	});
});

describe("hasher lifecycle", () => {
	it("reset() allows reuse with same key (xet workload pattern)", () => {
		const hasher = Hasher.newKeyed(KEY);
		const a = makeInput(65536);
		const b = makeInput(8192);

		const a1 = toHex(hasher.reset().update(a).finalize(32));
		const b1 = toHex(hasher.reset().update(b).finalize(32));
		const a2 = toHex(hasher.reset().update(a).finalize(32));
		const aRef = toHex(Hasher.newKeyed(KEY).update(a).finalize(32));
		const bRef = toHex(Hasher.newKeyed(KEY).update(b).finalize(32));

		expect(a1).toBe(aRef);
		expect(a2).toBe(aRef);
		expect(b1).toBe(bRef);
	});

	it("interleaved hashers produce correct results (staging-area eviction)", () => {
		const inputA = makeInput(70000);
		const inputB = makeInput(9000);
		const refA = toHex(Hasher.newKeyed(KEY).update(inputA).finalize(32));
		const refB = toHex(new Hasher().update(inputB).finalize(32));

		const hasherA = Hasher.newKeyed(KEY);
		const hasherB = new Hasher();
		hasherA.update(inputA.subarray(0, 30000));
		hasherB.update(inputB.subarray(0, 5000)); // evicts A
		hasherA.update(inputA.subarray(30000)); // evicts B
		hasherB.update(inputB.subarray(5000)); // evicts A again
		expect(toHex(hasherA.finalize(32))).toBe(refA);
		expect(toHex(hasherB.finalize(32))).toBe(refB);
	});

	it("finalize() twice and finalize with different lengths", () => {
		const input = makeInput(3073);
		const hasher = Hasher.newKeyed(KEY);
		hasher.update(input);
		const first = toHex(hasher.finalize(32));
		const second = toHex(hasher.finalize(32));
		const extended = toHex(hasher.finalize(64));
		expect(second).toBe(first);
		expect(extended.slice(0, 64)).toBe(first);
	});

	it("update after finalize continues the message", () => {
		const input = makeInput(5121);
		const reference = toHex(new Hasher().update(input).finalize(32));

		const hasher = new Hasher();
		hasher.update(input.subarray(0, 1000));
		hasher.finalize(32); // intermediate result, should not disturb state
		hasher.update(input.subarray(1000));
		expect(toHex(hasher.finalize(32))).toBe(reference);
	});
});

describe("XOF output", () => {
	it("finalizeXof matches finalize for long outputs", () => {
		const input = makeInput(4097);
		const expected = toHex(new Hasher().update(input).finalize(300));
		const xof = new Hasher().update(input).finalizeXof();
		const pieces = [xof.read(1), xof.read(63), xof.read(100), xof.read(136)];
		const combined = new Uint8Array(300);
		let off = 0;
		for (const piece of pieces) {
			combined.set(piece, off);
			off += piece.length;
		}
		expect(toHex(combined)).toBe(expected);
	});
});

describe("hashInto", () => {
	it("writes the same output as hash()", () => {
		for (const len of [0, 1, 1024, 4096, 65536]) {
			const input = makeInput(len);
			const out = new Uint8Array(32);
			hashInto(input, out, 32);
			expect(toHex(out)).toBe(toHex(hash(input)));
		}
	});
});

describe("misc", () => {
	it("createHasher() equals new Hasher()", () => {
		const input = makeInput(2049);
		expect(toHex(createHasher().update(input).finalize(32))).toBe(toHex(new Hasher().update(input).finalize(32)));
	});

	it("rejects invalid key length", () => {
		expect(() => Hasher.newKeyed(new Uint8Array(31))).toThrow();
	});

	it("hashes non-zero-offset subarrays correctly", () => {
		const buffer = makeInput(70003);
		const view = buffer.subarray(3, 65539); // unaligned offset
		const copy = new Uint8Array(view); // aligned copy
		expect(toHex(Hasher.newKeyed(KEY).update(view).finalize(32))).toBe(
			toHex(Hasher.newKeyed(KEY).update(copy).finalize(32)),
		);
	});
});

// Regression tests: the shared-memory API hands the one-shot engine's
// WebAssembly.Memory to external callers (e.g. gearhash-jit's
// instantiateGearScanner), which may grow it directly. grow() detaches the
// engine's cached views; an in-flight hasher buffering its message in the
// staging area must still replay the correct bytes when evicted afterwards.
describe("external memory growth (shared-memory path)", () => {
	function growExternally(): boolean {
		const ctx = getOneShotContext();
		if (!ctx) {
			return false; // wasm one-shot engine unavailable: fast path off, nothing to test
		}
		ctx.memory.grow(1); // detaches all views cached before this call
		return true;
	}

	it("eviction by another hasher replays buffered bytes after external grow", () => {
		const input = makeInput(1000);
		const expected = toHex(new Hasher().update(input).finalize(32));

		const a = new Hasher().update(input); // buffers into wasm staging (fast path)
		if (!growExternally()) {
			return;
		}
		new Hasher().update(makeInput(10)).finalize(32); // claims staging → evicts `a`
		expect(toHex(a.finalize(32))).toBe(expected);
	});

	it("eviction by keyed one-shot claim replays buffered bytes after external grow", () => {
		const input = makeInput(4096);
		const expected = toHex(Hasher.newKeyed(KEY).update(input).finalize(32));

		const a = Hasher.newKeyed(KEY).update(input);
		if (!growExternally()) {
			return;
		}
		hash(makeInput(5)); // one-shot hash() claims staging → evicts `a`
		expect(toHex(a.finalize(32))).toBe(expected);
	});

	it("XOF finalize (>32B) replays buffered bytes after external grow", () => {
		const input = makeInput(2048);
		const expected = toHex(hash(input, 64));

		const a = new Hasher().update(input);
		if (!growExternally()) {
			return;
		}
		// outputLength > 32 forces the scalar output machinery → evictOneShot
		expect(toHex(a.finalize(64))).toBe(expected);
	});
});
