/**
 * gearhash-jit — Fast GEAR rolling hash for content-defined chunking.
 *
 * Uses a tiny hand-written WASM module with native i64 arithmetic.
 * The hash state is kept as raw bytes in JS (avoiding BigInt in the hot path)
 * and written to WASM memory only for the `nextMatch` call.
 */

import {
	initWasm,
	wasmNextMatch,
	getView,
	ensureInputCapacity,
	HASH_OFFSET,
	MASK_OFFSET,
	INPUT_OFFSET,
} from "./wasm.js";

export { GEAR_TABLE } from "./table.js";

export class Hasher {
	private readonly maskBytes: Uint8Array;
	private loadedLength: number;

	/**
	 * The current 64-bit rolling hash state as 8 little-endian bytes.
	 * Updated after every `nextMatch` call. Zeroed by `resetHash()`.
	 */
	readonly hash: Uint8Array;

	constructor(mask: bigint) {
		initWasm();
		this.maskBytes = new Uint8Array(8);
		this.hash = new Uint8Array(8);
		this.loadedLength = 0;
		new DataView(this.maskBytes.buffer).setBigUint64(0, mask, true);
	}

	/**
	 * Scan `buf` for the next gear-hash match. The internal hash state
	 * carries over between calls (for split-buffer scanning).
	 *
	 * Equivalent to `loadInput(buf)` + `nextMatchIn(0, buf.length)`, i.e. it
	 * copies `buf` into WASM memory. When scanning overlapping windows of one
	 * large buffer, prefer `loadInput` once + `nextMatchIn` per window.
	 *
	 * @returns 1-based byte position of the match, or -1 if none found.
	 */
	nextMatch(buf: Uint8Array): number {
		this.loadInput(buf);
		return this.nextMatchIn(0, buf.length);
	}

	/**
	 * Copy `buf` into WASM memory (growing it if needed) so that subsequent
	 * `nextMatchIn` calls can scan arbitrary windows of it without re-copying.
	 *
	 * Note: the input region is shared module-wide — interleaving `loadInput`
	 * or `nextMatch` calls from another Hasher invalidates the loaded data
	 * (hash/mask state is still per-Hasher and always safe).
	 */
	loadInput(buf: Uint8Array): void {
		ensureInputCapacity(buf.length);
		getView().set(buf, INPUT_OFFSET);
		this.loadedLength = buf.length;
	}

	/**
	 * Scan `length` bytes starting at `offset` within the input loaded by the
	 * last `loadInput` call. The internal hash state carries over between calls.
	 *
	 * @returns 1-based byte position of the match within the window, or -1.
	 */
	nextMatchIn(offset: number, length: number): number {
    if (length <= 0) {
      return -1;
    }
		if (offset < 0 || offset + length > this.loadedLength) {
			throw new RangeError(`Scan window [${offset}, ${offset + length}) outside loaded input (${this.loadedLength})`);
		}

		const view = getView();
		view.set(this.hash, HASH_OFFSET);
		view.set(this.maskBytes, MASK_OFFSET);

		const pos = wasmNextMatch(INPUT_OFFSET + offset, length);

		this.hash.set(view.subarray(HASH_OFFSET, HASH_OFFSET + 8));
		return pos;
	}

	/** Reset rolling hash to zero (call when starting a new chunk). */
	resetHash(): void {
		this.hash.fill(0);
	}
}
