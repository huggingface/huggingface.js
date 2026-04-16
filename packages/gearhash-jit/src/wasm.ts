/**
 * GEAR hash WASM - Runtime bytecode generation
 *
 * Generates a tiny WebAssembly module with a single `nextMatch` function
 * that performs the gear hash rolling scan using native i64 arithmetic.
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
const PAGES = 8; // 512 KB
export const MAX_INPUT_SIZE = PAGES * 65536 - INPUT_OFFSET;

let wasmMemory: WebAssembly.Memory | null = null;
let wasmView: Uint8Array | null = null;
let wasmFn: ((inputStart: number, inputLen: number) => number) | null = null;

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
 *   nextMatch(inputStart: i32, inputLen: i32) -> i32
 *
 * Reads hash/mask from fixed memory offsets, scans from `inputStart`
 * for `inputLen` bytes, writes updated hash back.
 * Returns 1-based match position within the scanned range, or -1.
 */
function generateWasmBytes(): Uint8Array {
  const code: number[] = [];
  function emit(...bytes: number[]): void {
    code.push(...bytes);
  }

  // ── Module header ──
  emit(0x00, 0x61, 0x73, 0x6d); // magic
  emit(0x01, 0x00, 0x00, 0x00); // version 1

  // ── Type section: (i32, i32) -> (i32) ──
  emit(0x01, 0x07, 0x01, 0x60, 0x02, 0x7f, 0x7f, 0x01, 0x7f);

  // ── Import section: memory "js"."mem" min=PAGES ──
  emit(0x02, 0x0b, 0x01, 0x02, 0x6a, 0x73, 0x03, 0x6d, 0x65, 0x6d, 0x02, 0x00, PAGES);

  // ── Function section: 1 function, type 0 ──
  emit(0x03, 0x02, 0x01, 0x00);

  // ── Export section: "nextMatch" -> func 0 ──
  emit(0x07, 0x0d, 0x01, 0x09, 0x6e, 0x65, 0x78, 0x74, 0x4d, 0x61, 0x74, 0x63, 0x68, 0x00, 0x00);

  // ── Code section ──
  emit(0x0a);
  const sectionSizeOff = code.length;
  emit(0x00, 0x00, 0x00, 0x00, 0x00);

  emit(0x01); // 1 function body

  const funcSizeOff = code.length;
  emit(0x00, 0x00, 0x00, 0x00, 0x00);

  const bodyStart = code.length;

  // Locals: $0 = inputStart (param), $1 = inputLen (param)
  //         $2 = hash (i64), $3 = mask (i64)
  //         $4 = ptr (i32),  $5 = end (i32)
  emit(0x02, 0x02, 0x7e, 0x02, 0x7f);

  // Load hash from memory[HASH_OFFSET]
  emit(0x41, ...toSignedLeb128(HASH_OFFSET));
  emit(0x29, 0x03, 0x00);
  emit(0x21, 0x02);

  // Load mask from memory[MASK_OFFSET]
  emit(0x41, ...toSignedLeb128(MASK_OFFSET));
  emit(0x29, 0x03, 0x00);
  emit(0x21, 0x03);

  // ptr = inputStart
  emit(0x20, 0x00);
  emit(0x21, 0x04);

  // end = inputStart + inputLen
  emit(0x20, 0x00);
  emit(0x20, 0x01);
  emit(0x6a);
  emit(0x21, 0x05);

  // block $done
  emit(0x02, 0x40);
  // loop $loop
  emit(0x03, 0x40);

  // if ptr >= end → break
  emit(0x20, 0x04);
  emit(0x20, 0x05);
  emit(0x4e);
  emit(0x0d, 0x01);

  // hash = (hash << 1) + table[mem[ptr] * 8]
  emit(0x20, 0x02);
  emit(0x42, 0x01);
  emit(0x86);
  emit(0x20, 0x04);
  emit(0x2d, 0x00, 0x00);
  emit(0x41, 0x03);
  emit(0x74);
  emit(0x29, 0x03, 0x00);
  emit(0x7c);
  emit(0x22, 0x02);

  // if (hash & mask) == 0 → match
  emit(0x20, 0x03);
  emit(0x83);
  emit(0x50);
  emit(0x04, 0x40);

  // Store updated hash
  emit(0x41, ...toSignedLeb128(HASH_OFFSET));
  emit(0x20, 0x02);
  emit(0x37, 0x03, 0x00);

  // Return: ptr - inputStart + 1
  emit(0x20, 0x04);
  emit(0x20, 0x00);
  emit(0x6b);
  emit(0x41, 0x01);
  emit(0x6a);
  emit(0x0f);

  emit(0x0b); // end if

  // ptr++
  emit(0x20, 0x04);
  emit(0x41, 0x01);
  emit(0x6a);
  emit(0x21, 0x04);

  emit(0x0c, 0x00); // br $loop

  emit(0x0b); // end loop
  emit(0x0b); // end block

  // no match: store hash, return -1
  emit(0x41, ...toSignedLeb128(HASH_OFFSET));
  emit(0x20, 0x02);
  emit(0x37, 0x03, 0x00);
  emit(0x41, 0x7f);

  emit(0x0b); // end function

  // Backpatch sizes
  const bodySize = code.length - bodyStart;
  const bsPatch = toLebU32Padded5(bodySize);
  for (let i = 0; i < 5; i++) code[funcSizeOff + i] = bsPatch[i];

  const secSize = code.length - sectionSizeOff - 5;
  const ssPatch = toLebU32Padded5(secSize);
  for (let i = 0; i < 5; i++) code[sectionSizeOff + i] = ssPatch[i];

  return new Uint8Array(code);
}

export function initWasm(): void {
  if (wasmFn) return;

  const bytes = generateWasmBytes();
  wasmMemory = new WebAssembly.Memory({ initial: PAGES });
  const module = new WebAssembly.Module(bytes);
  const instance = new WebAssembly.Instance(module, { js: { mem: wasmMemory } });
  wasmFn = instance.exports.nextMatch as (start: number, len: number) => number;
  wasmView = new Uint8Array(wasmMemory.buffer);

  const dv = new DataView(wasmMemory.buffer);
  for (let i = 0; i < 256; i++) {
    dv.setBigUint64(TABLE_OFFSET + i * 8, GEAR_TABLE[i], true);
  }
}

export function wasmNextMatch(inputStart: number, inputLen: number): number {
  return wasmFn!(inputStart, inputLen);
}

export function getView(): Uint8Array {
  return wasmView!;
}
