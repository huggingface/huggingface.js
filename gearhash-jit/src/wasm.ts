/**
 * GEAR hash WASM - Runtime bytecode generation
 *
 * Generates a tiny WebAssembly module with a single `nextMatch` function
 * that performs the gear hash rolling scan using native i64 arithmetic.
 *
 * The critical insight: gear hash needs 64-bit operations (shift, add, and-mask).
 * In JS this means BigInt (slow, heap-allocated). In WASM, i64 ops are single
 * native instructions with zero overhead.
 *
 * Memory layout (all little-endian):
 *   0-2047:     Gear lookup table (256 × 8 bytes)
 *   2048-2055:  Hash state (u64, persists across calls)
 *   2056-2063:  Mask (u64, set per-hasher before each call)
 *   4096+:      Input buffer
 */

import { GEAR_TABLE } from "./table.js";

export const TABLE_OFFSET = 0;
export const HASH_OFFSET = 2048;
export const MASK_OFFSET = 2056;
export const INPUT_OFFSET = 4096;
const PAGES = 8; // 512 KB — fits up to ~500 KB input buffers
export const MAX_INPUT_SIZE = PAGES * 65536 - INPUT_OFFSET;

let wasmMemory: WebAssembly.Memory | null = null;
let wasmView: Uint8Array | null = null;
let wasmFn: ((len: number) => number) | null = null;

// Signed LEB128 for i32.const immediates
function toSignedLeb128(n: number): number[] {
  const bytes: number[] = [];
  let value = n | 0;
  for (;;) {
    const byte = value & 0x7f;
    value >>= 7;
    if ((value === 0 && (byte & 0x40) === 0) || (value === -1 && (byte & 0x40) !== 0)) {
      bytes.push(byte);
      return bytes;
    }
    bytes.push(byte | 0x80);
  }
}

// Padded LEB128 u32 (exactly 5 bytes, for backpatching)
function toLebU32Padded5(n: number): number[] {
  return [
    (n & 0x7f) | 0x80,
    ((n >>> 7) & 0x7f) | 0x80,
    ((n >>> 14) & 0x7f) | 0x80,
    ((n >>> 21) & 0x7f) | 0x80,
    (n >>> 28) & 0x0f,
  ];
}

/**
 * Generate the WASM module bytecode.
 *
 * Exports one function:
 *   nextMatch(inputLen: i32) -> i32
 *
 * Reads hash/mask from fixed memory offsets, scans input starting at
 * INPUT_OFFSET, writes updated hash back. Returns 1-based match position
 * or -1 if no match.
 */
function generateWasmBytes(): Uint8Array {
  const code: number[] = [];
  function emit(...bytes: number[]): void {
    code.push(...bytes);
  }

  // ── Module header ──
  emit(0x00, 0x61, 0x73, 0x6d); // magic
  emit(0x01, 0x00, 0x00, 0x00); // version 1

  // ── Type section: (i32) -> (i32) ──
  emit(0x01, 0x06, 0x01, 0x60, 0x01, 0x7f, 0x01, 0x7f);

  // ── Import section: memory "js"."mem" min=PAGES ──
  emit(0x02, 0x0b, 0x01, 0x02, 0x6a, 0x73, 0x03, 0x6d, 0x65, 0x6d, 0x02, 0x00, PAGES);

  // ── Function section: 1 function, type 0 ──
  emit(0x03, 0x02, 0x01, 0x00);

  // ── Export section: "nextMatch" -> func 0 ──
  // "nextMatch" = 9 bytes: 6e 65 78 74 4d 61 74 63 68
  emit(0x07, 0x0d, 0x01, 0x09, 0x6e, 0x65, 0x78, 0x74, 0x4d, 0x61, 0x74, 0x63, 0x68, 0x00, 0x00);

  // ── Code section ──
  emit(0x0a);
  const sectionSizeOff = code.length;
  emit(0x00, 0x00, 0x00, 0x00, 0x00); // reserve 5 bytes

  emit(0x01); // 1 function body

  const funcSizeOff = code.length;
  emit(0x00, 0x00, 0x00, 0x00, 0x00); // reserve 5 bytes

  const bodyStart = code.length;

  // Locals: $0 = inputLen (param i32)
  //         $1 = hash (i64), $2 = mask (i64)
  //         $3 = ptr (i32),  $4 = end (i32)
  emit(0x02, 0x02, 0x7e, 0x02, 0x7f); // 2 decl groups: 2×i64, 2×i32

  // Load hash from memory[HASH_OFFSET]
  emit(0x41, ...toSignedLeb128(HASH_OFFSET)); // i32.const 2048
  emit(0x29, 0x03, 0x00); // i64.load align=3
  emit(0x21, 0x01); // local.set $1

  // Load mask from memory[MASK_OFFSET]
  emit(0x41, ...toSignedLeb128(MASK_OFFSET)); // i32.const 2056
  emit(0x29, 0x03, 0x00); // i64.load align=3
  emit(0x21, 0x02); // local.set $2

  // ptr = INPUT_OFFSET
  emit(0x41, ...toSignedLeb128(INPUT_OFFSET)); // i32.const 4096
  emit(0x21, 0x03); // local.set $3

  // end = INPUT_OFFSET + inputLen
  emit(0x41, ...toSignedLeb128(INPUT_OFFSET)); // i32.const 4096
  emit(0x20, 0x00); // local.get $0 (inputLen)
  emit(0x6a); // i32.add
  emit(0x21, 0x04); // local.set $4

  // block $done
  emit(0x02, 0x40);
  // loop $loop
  emit(0x03, 0x40);

  // ── bounds check: if ptr >= end → break ──
  emit(0x20, 0x03); // local.get $3 (ptr)
  emit(0x20, 0x04); // local.get $4 (end)
  emit(0x4e); // i32.ge_u
  emit(0x0d, 0x01); // br_if 1 (→ $done)

  // ── hash = (hash << 1) + table[mem[ptr] * 8] ──
  emit(0x20, 0x01); // local.get $1 (hash)
  emit(0x42, 0x01); // i64.const 1
  emit(0x86); // i64.shl
  emit(0x20, 0x03); // local.get $3 (ptr)
  emit(0x2d, 0x00, 0x00); // i32.load8_u align=0 offset=0
  emit(0x41, 0x03); // i32.const 3
  emit(0x74); // i32.shl  → byte * 8
  emit(0x29, 0x03, 0x00); // i64.load align=3 offset=0  → table[byte]
  emit(0x7c); // i64.add
  emit(0x22, 0x01); // local.tee $1 (hash) — keep on stack for mask test

  // ── if (hash & mask) == 0 → match ──
  emit(0x20, 0x02); // local.get $2 (mask)
  emit(0x83); // i64.and
  emit(0x50); // i64.eqz
  emit(0x04, 0x40); // if void

  // Store updated hash
  emit(0x41, ...toSignedLeb128(HASH_OFFSET));
  emit(0x20, 0x01); // local.get $1 (hash)
  emit(0x37, 0x03, 0x00); // i64.store align=3

  // Return 1-based position: ptr - INPUT_OFFSET + 1
  emit(0x20, 0x03); // local.get $3 (ptr)
  emit(0x41, ...toSignedLeb128(INPUT_OFFSET));
  emit(0x6b); // i32.sub
  emit(0x41, 0x01); // i32.const 1
  emit(0x6a); // i32.add
  emit(0x0f); // return

  emit(0x0b); // end if

  // ── ptr++ ──
  emit(0x20, 0x03); // local.get $3
  emit(0x41, 0x01); // i32.const 1
  emit(0x6a); // i32.add
  emit(0x21, 0x03); // local.set $3

  // br $loop
  emit(0x0c, 0x00);

  emit(0x0b); // end loop
  emit(0x0b); // end block

  // ── no match: store hash, return -1 ──
  emit(0x41, ...toSignedLeb128(HASH_OFFSET));
  emit(0x20, 0x01); // local.get $1 (hash)
  emit(0x37, 0x03, 0x00); // i64.store align=3
  emit(0x41, 0x7f); // i32.const -1

  emit(0x0b); // end function

  // ── Backpatch sizes ──
  const bodySize = code.length - bodyStart;
  const bsPatch = toLebU32Padded5(bodySize);
  for (let i = 0; i < 5; i++) code[funcSizeOff + i] = bsPatch[i];

  const secSize = code.length - sectionSizeOff - 5;
  const ssPatch = toLebU32Padded5(secSize);
  for (let i = 0; i < 5; i++) code[sectionSizeOff + i] = ssPatch[i];

  return new Uint8Array(code);
}

/**
 * Initialize the WASM module (idempotent). Bakes the gear table into
 * WASM linear memory on first call.
 */
export function initWasm(): void {
  if (wasmFn) return;

  const bytes = generateWasmBytes();
  wasmMemory = new WebAssembly.Memory({ initial: PAGES });
  const module = new WebAssembly.Module(bytes);
  const instance = new WebAssembly.Instance(module, { js: { mem: wasmMemory } });
  wasmFn = instance.exports.nextMatch as (len: number) => number;
  wasmView = new Uint8Array(wasmMemory.buffer);

  // Write gear table into memory at offset 0
  const dv = new DataView(wasmMemory.buffer);
  for (let i = 0; i < 256; i++) {
    dv.setBigUint64(TABLE_OFFSET + i * 8, GEAR_TABLE[i], true);
  }
}

/** Call the WASM nextMatch. Input must already be in memory. */
export function wasmNextMatch(len: number): number {
  return wasmFn!(len);
}

export function getView(): Uint8Array {
  return wasmView!;
}
