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
  HASH_OFFSET,
  MASK_OFFSET,
  INPUT_OFFSET,
  MAX_INPUT_SIZE,
} from "./wasm.js";

export { GEAR_TABLE } from "./table.js";

export class Hasher {
  private readonly maskBytes: Uint8Array;
  private readonly hashState: Uint8Array;

  constructor(mask: bigint) {
    initWasm();
    this.maskBytes = new Uint8Array(8);
    this.hashState = new Uint8Array(8);
    new DataView(this.maskBytes.buffer).setBigUint64(0, mask, true);
  }

  /**
   * Scan `buf` for the next gear-hash match. The internal hash state
   * carries over between calls (for split-buffer scanning).
   *
   * @returns 1-based byte position of the match, or -1 if none found.
   */
  nextMatch(buf: Uint8Array): number {
    const len = buf.length;
    if (len === 0) return -1;
    if (len > MAX_INPUT_SIZE) {
      throw new RangeError(`Input too large: ${len} > ${MAX_INPUT_SIZE}`);
    }

    const view = getView();
    view.set(this.hashState, HASH_OFFSET);
    view.set(this.maskBytes, MASK_OFFSET);
    view.set(buf, INPUT_OFFSET);

    const pos = wasmNextMatch(len);

    this.hashState.set(view.subarray(HASH_OFFSET, HASH_OFFSET + 8));
    return pos;
  }

  /** Reset rolling hash to zero (call when starting a new chunk). */
  resetHash(): void {
    this.hashState.fill(0);
  }
}
