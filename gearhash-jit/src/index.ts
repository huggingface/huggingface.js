/**
 * gearhash-jit — Fast GEAR rolling hash via hand-written WASM i64 bytecode.
 *
 * Designed for content-defined chunking (CDC). The hot loop runs entirely
 * in WASM using native i64 arithmetic, avoiding BigInt overhead in JS.
 *
 * @example
 * ```typescript
 * import { Hasher } from 'gearhash-jit';
 *
 * const hasher = new Hasher(mask);
 * const pos = hasher.nextMatch(buffer);
 * if (pos !== -1) {
 *   // chunk boundary at `pos` (1-based)
 * }
 * hasher.resetHash();
 * ```
 */

import { initWasm, wasmNextMatch, getView, HASH_OFFSET, MASK_OFFSET, INPUT_OFFSET, MAX_INPUT_SIZE } from "./wasm.js";

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
      throw new Error(`Input exceeds WASM buffer (${len} > ${MAX_INPUT_SIZE})`);
    }

    const view = getView();

    // Write per-instance state into the shared WASM scratchpad
    view.set(this.hashState, HASH_OFFSET);
    view.set(this.maskBytes, MASK_OFFSET);

    // Copy scan data into WASM memory
    view.set(buf, INPUT_OFFSET);

    const pos = wasmNextMatch(len);

    // Read back updated hash
    this.hashState.set(view.subarray(HASH_OFFSET, HASH_OFFSET + 8));

    return pos;
  }

  /** Reset rolling hash to zero (call when starting a new chunk). */
  resetHash(): void {
    this.hashState.fill(0);
  }
}
