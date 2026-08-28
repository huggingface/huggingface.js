/**
 * GEAR hash WASM - Runtime bytecode generation
 *
 * Generates a tiny WebAssembly module with a single `nextMatch` function
 * that performs the gear hash rolling scan using native i64 arithmetic.
 *
 * The scan kernel is unrolled 8× and breaks the per-byte dependency chain:
 * instead of `hash = (hash << 1) + t[b]` serially (2-cycle chain per byte),
 * it accumulates the table terms into `T` (`T = (T << 1) + t[b_k]`, a chain
 * that is independent of `hash`) and derives each intermediate hash as
 * `h_k = (hash << k) + T_k`. The cross-group critical path is then only
 * `hash' = (hash << 8) + T_8` — 2 cycles per 8 bytes instead of per byte.
 *
 * Memory layout (all little-endian):
 *   0-2047:     Gear lookup table (256 × 8 bytes)
 *   2048-2055:  Hash state (u64, persists across calls)
 *   2056-2063:  Mask (u64, set per-hasher before each call)
 *   4096+:      Input buffer (memory grows on demand for larger inputs)
 */

import { GEAR_TABLE } from "./table.js";

export const TABLE_OFFSET = 0;
export const HASH_OFFSET = 2048;
export const MASK_OFFSET = 2056;
export const INPUT_OFFSET = 4096;
const PAGES = 8; // 512 KB initial; grows on demand
const UNROLL = 16;

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

function toUnsignedLeb128(n: number): number[] {
	const bytes: number[] = [];
	let value = n >>> 0;
	for (;;) {
		const byte = value & 0x7f;
		value >>>= 7;
		if (value === 0) {
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
function generateWasmBytes(
	tableOffset: number = TABLE_OFFSET,
	hashOffset: number = HASH_OFFSET,
	maskOffset: number = MASK_OFFSET,
): Uint8Array {
	const code: number[] = [];
	function emit(...bytes: number[]): void {
		code.push(...bytes);
	}

	// Locals: $0 = inputStart (param i32), $1 = inputLen (param i32)
	//         $2 = hash (i64), $3 = mask (i64)
	//         $4 = ptr (i32),  $5 = end (i32),  $6 = endU (i32)
	const HASH = 2,
		MASK = 3,
		PTR = 4,
		END = 5,
		ENDU = 6;

	// ── Module header ──
	emit(0x00, 0x61, 0x73, 0x6d); // magic
	emit(0x01, 0x00, 0x00, 0x00); // version 1

	// ── Type section: (i32, i32) -> (i32) ──
	emit(0x01, 0x07, 0x01, 0x60, 0x02, 0x7f, 0x7f, 0x01, 0x7f);

	// ── Import section: memory "js"."mem" min=PAGES (no max → growable) ──
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

	// Local declarations: 2 × i64 ($2-$3), 3 × i32 ($4-$6)
	emit(0x02, 0x02, 0x7e, 0x03, 0x7f);

	// hash = mem64[HASH_OFFSET]
	emit(0x41, ...toSignedLeb128(hashOffset));
	emit(0x29, 0x03, 0x00);
	emit(0x21, HASH);

	// mask = mem64[MASK_OFFSET]
	emit(0x41, ...toSignedLeb128(maskOffset));
	emit(0x29, 0x03, 0x00);
	emit(0x21, MASK);

	// ptr = inputStart
	emit(0x20, 0x00);
	emit(0x21, PTR);

	// end = inputStart + inputLen
	emit(0x20, 0x00);
	emit(0x20, 0x01);
	emit(0x6a);
	emit(0x21, END);

	// endU = end - (UNROLL - 1)   (unrolled loop is valid while ptr < endU)
	emit(0x20, END);
	emit(0x41, ...toSignedLeb128(UNROLL - 1));
	emit(0x6b);
	emit(0x21, ENDU);

	// Emits: load table entry for byte at ptr+k → leaves i64 on stack
	function emitTableLookup(k: number): void {
		emit(0x20, PTR); // local.get ptr
		emit(0x2d, 0x00, ...toUnsignedLeb128(k)); // i32.load8_u align=0 offset=k
		emit(0x41, 0x03); // i32.const 3
		emit(0x74); // i32.shl
		emit(0x29, 0x03, ...toUnsignedLeb128(tableOffset)); // i64.load align=3
	}

	// Emits: test i64 on stack against mask; if (v & mask) == 0,
	// store `local` to HASH_OFFSET and return ptr - inputStart + k.
	// Consumes the stack value.
	function emitMatchTest(local: number, k: number): void {
		emit(0x20, MASK); // local.get mask
		emit(0x83); // i64.and
		emit(0x50); // i64.eqz
		emit(0x04, 0x40); // if (void)
		emit(0x41, ...toSignedLeb128(hashOffset)); // i32.const HASH_OFFSET
		emit(0x20, local); // local.get <matched hash>
		emit(0x37, 0x03, 0x00); // i64.store align=3
		emit(0x20, PTR); // local.get ptr
		emit(0x20, 0x00); // local.get inputStart
		emit(0x6b); // i32.sub
		emit(0x41, ...toSignedLeb128(k)); // i32.const k
		emit(0x6a); // i32.add
		emit(0x0f); // return
		emit(0x0b); // end if
	}

	// ── Unrolled main loop ──
	// block $tail
	emit(0x02, 0x40);
	// loop $main
	emit(0x03, 0x40);

	// if ptr >= endU → br $tail
	emit(0x20, PTR);
	emit(0x20, ENDU);
	emit(0x4e); // i32.ge_s
	emit(0x0d, 0x01); // br_if $tail

	for (let k = 1; k <= UNROLL; k++) {
		// hash = (hash << 1) + table[b_{k-1}]
		// (x64 JITs emit this as a single 1-cycle `lea hash,[t + hash*2]`,
		// so the serial chain costs 1 cycle/byte; unrolling amortizes the
		// loop/bounds/stack-check overhead across UNROLL bytes.)
		emit(0x20, HASH);
		emit(0x42, 0x01); // i64.const 1
		emit(0x86); // i64.shl
		emitTableLookup(k - 1);
		emit(0x7c); // i64.add
		emit(0x22, HASH); // local.tee hash
		emitMatchTest(HASH, k);
	}

	// ptr += UNROLL
	emit(0x20, PTR);
	emit(0x41, ...toSignedLeb128(UNROLL));
	emit(0x6a);
	emit(0x21, PTR);

	emit(0x0c, 0x00); // br $main
	emit(0x0b); // end loop
	emit(0x0b); // end block ($tail)

	// ── Tail: simple per-byte loop ──
	// block $done
	emit(0x02, 0x40);
	// loop $loop
	emit(0x03, 0x40);

	// if ptr >= end → break
	emit(0x20, PTR);
	emit(0x20, END);
	emit(0x4e);
	emit(0x0d, 0x01);

	// hash = (hash << 1) + table[mem[ptr]]
	emit(0x20, HASH);
	emit(0x42, 0x01);
	emit(0x86);
	emitTableLookup(0);
	emit(0x7c);
	emit(0x22, HASH); // local.tee hash

	emitMatchTest(HASH, 1);

	// ptr++
	emit(0x20, PTR);
	emit(0x41, 0x01);
	emit(0x6a);
	emit(0x21, PTR);

	emit(0x0c, 0x00); // br $loop
	emit(0x0b); // end loop
	emit(0x0b); // end block

	// no match: store hash, return -1
	emit(0x41, ...toSignedLeb128(hashOffset));
	emit(0x20, HASH);
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

/**
 * Instantiate an additional gear scanner bound to an EXTERNAL (shared)
 * WebAssembly.Memory, with its fixed regions (table/hash/mask) rebased to
 * `baseOffset` (2064 bytes are used). Input windows are addressed absolutely
 * within the shared memory via `nextMatch(inputStart, inputLen)`.
 *
 * The caller owns hash/mask state management (8 LE bytes each at the returned
 * offsets) and must tolerate `memory.grow` detaching prior buffer views.
 */
export function instantiateGearScanner(
	memory: WebAssembly.Memory,
	baseOffset: number,
): {
	nextMatch: (inputStart: number, inputLen: number) => number;
	hashOffset: number;
	maskOffset: number;
} {
	const tableOffset = baseOffset;
	const hashOffset = baseOffset + 2048;
	const maskOffset = baseOffset + 2056;

	const needed = baseOffset + 2064;
	if (memory.buffer.byteLength < needed) {
		memory.grow(Math.ceil((needed - memory.buffer.byteLength) / 65536));
	}

	const bytes = generateWasmBytes(tableOffset, hashOffset, maskOffset);
	const module = new WebAssembly.Module(bytes);
	const instance = new WebAssembly.Instance(module, { js: { mem: memory } });

	const dv = new DataView(memory.buffer);
	for (let i = 0; i < 256; i++) {
		dv.setBigUint64(tableOffset + i * 8, GEAR_TABLE[i], true);
	}

	return {
		nextMatch: instance.exports.nextMatch as (start: number, len: number) => number,
		hashOffset,
		maskOffset,
	};
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

/** Grow wasm memory (if needed) so the input region can hold `bytes` bytes. */
export function ensureInputCapacity(bytes: number): void {
	const needed = INPUT_OFFSET + bytes;
	const current = wasmMemory!.buffer.byteLength;
	if (needed > current) {
		wasmMemory!.grow(Math.ceil((needed - current) / 65536));
		wasmView = new Uint8Array(wasmMemory!.buffer);
	}
}

export function wasmNextMatch(inputStart: number, inputLen: number): number {
	return wasmFn!(inputStart, inputLen);
}

export function getView(): Uint8Array {
	return wasmView!;
}
