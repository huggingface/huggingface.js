/**
 * BLAKE3 WASM one-shot engine - Runtime bytecode generation
 *
 * Hashes an entire (keyed or unkeyed) message with a SINGLE JS->WASM call:
 *  - input bytes are copied linearly into wasm memory (one memcpy)
 *  - 4 BLAKE3 chunks (4 x 1024 bytes) are compressed in parallel with
 *    i32x4 SIMD, transposing the message words INSIDE wasm via i8x16.shuffle
 *  - parent (tree-merge) compressions also run 4-wide inside wasm
 *  - root finalization included; JS reads back 32 bytes
 *
 * This eliminates the per-block/per-group JS loops, JS-side transposition
 * and thousands of JS<->wasm boundary crossings of the previous design.
 *
 * Memory layout (bytes):
 *   0      KEY        8 words - key CV (IV for regular hashing)
 *   32     FLAGS      1 word  - base flags (0 / KEYED_HASH / DERIVE_KEY_*)
 *   64     OUT        8 words - final 32-byte hash output
 *   128    SCRATCH_CV 8 words - chained CV for scalar chunk processing
 *   1024   CV_ARR     4100 CVs x 32 bytes - leaf/parent chaining values
 *   132352 INPUT      message bytes (memory grows on demand)
 */

// ===== Constants =====

const KEY_OFF = 0;
const FLAGS_OFF = 32;
const OUT_OFF = 64;
const SCRATCH_OFF = 128;
const CV_ARR_OFF = 1024;
const INPUT_OFF = 132352;

/** Maximum message size for the one-shot path (CV_ARR sized for this). */
export const ONESHOT_MAX_INPUT = 4 * 1024 * 1024;

const PAGE_SIZE = 65536;
// Initial memory: covers layout + 256KB input + slack (typical xet chunks are <= 128KB)
const INITIAL_PAGES = 8;

const IV = [0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19];

// Message word access order for all 7 rounds (schedule pre-applied)
const MSG_ACCESS_ORDER = [
	0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 2, 6, 3, 10, 7, 0, 4, 13, 1, 11, 12, 5, 9, 14, 15, 8, 3, 4, 10,
	12, 13, 2, 7, 14, 6, 5, 9, 0, 11, 15, 8, 1, 10, 7, 12, 9, 14, 3, 13, 15, 4, 0, 11, 2, 5, 8, 1, 6, 12, 13, 9, 11, 15,
	10, 14, 8, 7, 2, 5, 3, 0, 1, 6, 4, 9, 14, 11, 5, 8, 12, 15, 1, 13, 3, 0, 10, 2, 6, 4, 7, 11, 15, 5, 0, 1, 9, 8, 6, 14,
	10, 2, 12, 3, 4, 7, 13,
];

// 4x4 i32 matrix transpose shuffle patterns (byte indices into 2 v128 operands)
const SHUF_A = [0, 1, 2, 3, 16, 17, 18, 19, 4, 5, 6, 7, 20, 21, 22, 23]; // interleave low words
const SHUF_B = [8, 9, 10, 11, 24, 25, 26, 27, 12, 13, 14, 15, 28, 29, 30, 31]; // interleave high words
const SHUF_C = [0, 1, 2, 3, 4, 5, 6, 7, 16, 17, 18, 19, 20, 21, 22, 23]; // low 64-bit halves
const SHUF_D = [8, 9, 10, 11, 12, 13, 14, 15, 24, 25, 26, 27, 28, 29, 30, 31]; // high 64-bit halves

// ===== LEB128 helpers =====

function lebU(n: number): number[] {
	const out: number[] = [];
	let v = n >>> 0;
	do {
		let b = v & 0x7f;
		v >>>= 7;
		if (v !== 0) {b |= 0x80;}
		out.push(b);
	} while (v !== 0);
	return out;
}

function lebS(n: number): number[] {
	const out: number[] = [];
	let value = n | 0;
	let more = true;
	while (more) {
		let byte = value & 0x7f;
		value >>= 7;
		if ((value === 0 && (byte & 0x40) === 0) || (value === -1 && (byte & 0x40) !== 0)) {
			more = false;
		} else {
			byte |= 0x80;
		}
		out.push(byte);
	}
	return out;
}

function lebUPadded5(n: number): number[] {
	return [
		(n & 0x7f) | 0x80,
		((n >>> 7) & 0x7f) | 0x80,
		((n >>> 14) & 0x7f) | 0x80,
		((n >>> 21) & 0x7f) | 0x80,
		(n >>> 28) & 0x0f,
	];
}

// ===== Bytecode emit helpers =====

type Code = number[];

function splatBytes(word: number): number[] {
	const b: number[] = [];
	for (let i = 0; i < 4; i++) {
		b.push(word & 0xff, (word >>> 8) & 0xff, (word >>> 16) & 0xff, (word >>> 24) & 0xff);
	}
	return b;
}

// opcodes
const LOCAL_GET = 0x20;
const LOCAL_SET = 0x21;
const LOCAL_TEE = 0x22;
const I32_CONST = 0x41;
const I32_LOAD = 0x28;
const I32_STORE = 0x36;
const I32_ADD = 0x6a;
const I32_SUB = 0x6b;
const I32_AND = 0x71;
const I32_OR = 0x72;
const I32_XOR = 0x73;
const I32_SHL = 0x74;
const I32_SHR_U = 0x76;
const I32_ROTR = 0x78;
const I32_EQZ = 0x45;
const I32_EQ = 0x46;
const I32_NE = 0x47;
const I32_LT_U = 0x49;
const I32_GT_U = 0x4b;
const I32_LE_U = 0x4d;
const I32_GE_U = 0x4f;
const SELECT = 0x1b;
const CALL = 0x10;
const BLOCK = 0x02;
const LOOP = 0x03;
const IF = 0x04;
const END = 0x0b;
const BR = 0x0c;
const BR_IF = 0x0d;
const RETURN = 0x0f;
const VOID = 0x40;
const SIMD = 0xfd;

function emitI32Const(c: Code, n: number): void {
	c.push(I32_CONST, ...lebS(n));
}

function emitI32Load(c: Code, offset: number): void {
	c.push(I32_LOAD, 0x02, ...lebU(offset));
}

function emitI32Store(c: Code, offset: number): void {
	c.push(I32_STORE, 0x02, ...lebU(offset));
}

function emitV128Load(c: Code, offset: number): void {
	c.push(SIMD, 0x00, 0x02, ...lebU(offset));
}

function emitV128Store(c: Code, offset: number): void {
	c.push(SIMD, 0x0b, 0x02, ...lebU(offset));
}

function emitV128Const(c: Code, bytes: number[]): void {
	c.push(SIMD, 0x0c, ...bytes);
}

function emitShuffle(c: Code, pattern: number[]): void {
	c.push(SIMD, 0x0d, ...pattern);
}

const V_ADD = [SIMD, 0xae, 0x01]; // i32x4.add
const V_SHL = [SIMD, 0xab, 0x01]; // i32x4.shl
const V_SHR_U = [SIMD, 0xad, 0x01]; // i32x4.shr_u
const V_XOR = [SIMD, 0x51];
const V_OR = [SIMD, 0x50];
const V_SPLAT = [SIMD, 0x11]; // i32x4.splat

const ROTR16 = [2, 3, 0, 1, 6, 7, 4, 5, 10, 11, 8, 9, 14, 15, 12, 13];
const ROTR8 = [1, 2, 3, 0, 5, 6, 7, 4, 9, 10, 11, 8, 13, 14, 15, 12];

/**
 * Emit the 7 rounds of SIMD (4-wide) BLAKE3 mixing.
 * State lives in v128 locals [sBase..sBase+15], message in [mBase..mBase+15].
 */
function emitVecRounds(c: Code, sBase: number, mBase: number): void {
	let msgIdx = 0;

	// One quad of independent G functions (4 columns or 4 diagonals), emitted
	// interleaved step-by-step so the 4 dependency chains are adjacent in the
	// instruction stream (helps the register allocator / OoO scheduling).
	function gQuad(quads: number[][]): void {
		const mxs: number[] = [];
		const mys: number[] = [];
		for (let i = 0; i < 4; i++) {
			mxs.push(mBase + MSG_ACCESS_ORDER[msgIdx++]);
			mys.push(mBase + MSG_ACCESS_ORDER[msgIdx++]);
		}
		const sa = quads.map((q) => sBase + q[0]);
		const sb = quads.map((q) => sBase + q[1]);
		const sc = quads.map((q) => sBase + q[2]);
		const sd = quads.map((q) => sBase + q[3]);

		for (let half = 0; half < 2; half++) {
			const msg = half === 0 ? mxs : mys;
			const rotD = half === 0 ? ROTR16 : ROTR8;
			const shrB = half === 0 ? 12 : 7;
			const shlB = half === 0 ? 20 : 25;

			// s[a] = s[a] + s[b] + m
			for (let i = 0; i < 4; i++) {
				c.push(LOCAL_GET, sa[i], LOCAL_GET, sb[i], ...V_ADD, LOCAL_GET, msg[i], ...V_ADD, LOCAL_SET, sa[i]);
			}
			// s[d] = rotr16/8(s[d] ^ s[a])
			for (let i = 0; i < 4; i++) {
				c.push(LOCAL_GET, sd[i], LOCAL_GET, sa[i], ...V_XOR, LOCAL_TEE, sd[i], LOCAL_GET, sd[i]);
				emitShuffle(c, rotD);
				c.push(LOCAL_SET, sd[i]);
			}
			// s[c] = s[c] + s[d]
			for (let i = 0; i < 4; i++) {
				c.push(LOCAL_GET, sc[i], LOCAL_GET, sd[i], ...V_ADD, LOCAL_SET, sc[i]);
			}
			// s[b] = rotr12/7(s[b] ^ s[c])
			for (let i = 0; i < 4; i++) {
				c.push(LOCAL_GET, sb[i], LOCAL_GET, sc[i], ...V_XOR, LOCAL_TEE, sb[i]);
				c.push(I32_CONST, shrB, ...V_SHR_U, LOCAL_GET, sb[i], I32_CONST, shlB, ...V_SHL, ...V_OR);
				c.push(LOCAL_SET, sb[i]);
			}
		}
	}

	for (let round = 0; round < 7; round++) {
		// columns
		gQuad([
			[0, 4, 8, 12],
			[1, 5, 9, 13],
			[2, 6, 10, 14],
			[3, 7, 11, 15],
		]);
		// diagonals
		gQuad([
			[0, 5, 10, 15],
			[1, 6, 11, 12],
			[2, 7, 8, 13],
			[3, 4, 9, 14],
		]);
	}
}

/**
 * Emit the 7 rounds of scalar BLAKE3 mixing.
 * State lives in i32 locals [sBase..sBase+15], message in [mBase..mBase+15].
 */
function emitScalarRounds(c: Code, sBase: number, mBase: number): void {
	let msgIdx = 0;

	function g(a: number, b: number, d0: number, d1: number): void {
		const sa = sBase + a;
		const sb = sBase + b;
		const sc = sBase + d0;
		const sd = sBase + d1;
		const mx = mBase + MSG_ACCESS_ORDER[msgIdx++];
		const my = mBase + MSG_ACCESS_ORDER[msgIdx++];

		c.push(LOCAL_GET, sa, LOCAL_GET, sb, I32_ADD, LOCAL_GET, mx, I32_ADD, LOCAL_SET, sa);
		c.push(LOCAL_GET, sd, LOCAL_GET, sa, I32_XOR, I32_CONST, 16, I32_ROTR, LOCAL_SET, sd);
		c.push(LOCAL_GET, sc, LOCAL_GET, sd, I32_ADD, LOCAL_SET, sc);
		c.push(LOCAL_GET, sb, LOCAL_GET, sc, I32_XOR, I32_CONST, 12, I32_ROTR, LOCAL_SET, sb);
		c.push(LOCAL_GET, sa, LOCAL_GET, sb, I32_ADD, LOCAL_GET, my, I32_ADD, LOCAL_SET, sa);
		c.push(LOCAL_GET, sd, LOCAL_GET, sa, I32_XOR, I32_CONST, 8, I32_ROTR, LOCAL_SET, sd);
		c.push(LOCAL_GET, sc, LOCAL_GET, sd, I32_ADD, LOCAL_SET, sc);
		c.push(LOCAL_GET, sb, LOCAL_GET, sc, I32_XOR, I32_CONST, 7, I32_ROTR, LOCAL_SET, sb);
	}

	for (let round = 0; round < 7; round++) {
		g(0, 4, 8, 12);
		g(1, 5, 9, 13);
		g(2, 6, 10, 14);
		g(3, 7, 11, 15);
		g(0, 5, 10, 15);
		g(1, 6, 11, 12);
		g(2, 7, 8, 13);
		g(3, 4, 9, 14);
	}
}

/**
 * Emit a transposed 4x4-word load: read words [wg*4 .. wg*4+3] of 4 lanes
 * (lane j at address local(addrLocal) + j*laneStride + wg*16), transposing
 * into v128 locals m[wg*4 .. wg*4+3] (lane-per-element layout).
 * Uses 8 v128 temp locals starting at tBase.
 */
function emitTransposedLoad(
	c: Code,
	addrLocal: number,
	laneStride: number,
	wg: number,
	mBase: number,
	tBase: number,
): void {
	// load rows r0..r3 into t0..t3
	for (let lane = 0; lane < 4; lane++) {
		c.push(LOCAL_GET, addrLocal);
		emitV128Load(c, lane * laneStride + wg * 16);
		c.push(LOCAL_SET, tBase + lane);
	}
	// u0 = A(r0,r1), u1 = A(r2,r3), u2 = B(r0,r1), u3 = B(r2,r3)
	c.push(LOCAL_GET, tBase, LOCAL_GET, tBase + 1);
	emitShuffle(c, SHUF_A);
	c.push(LOCAL_SET, tBase + 4);
	c.push(LOCAL_GET, tBase + 2, LOCAL_GET, tBase + 3);
	emitShuffle(c, SHUF_A);
	c.push(LOCAL_SET, tBase + 5);
	c.push(LOCAL_GET, tBase, LOCAL_GET, tBase + 1);
	emitShuffle(c, SHUF_B);
	c.push(LOCAL_SET, tBase + 6);
	c.push(LOCAL_GET, tBase + 2, LOCAL_GET, tBase + 3);
	emitShuffle(c, SHUF_B);
	c.push(LOCAL_SET, tBase + 7);
	// m[wg*4+0] = C(u0,u1), m[+1] = D(u0,u1), m[+2] = C(u2,u3), m[+3] = D(u2,u3)
	c.push(LOCAL_GET, tBase + 4, LOCAL_GET, tBase + 5);
	emitShuffle(c, SHUF_C);
	c.push(LOCAL_SET, mBase + wg * 4);
	c.push(LOCAL_GET, tBase + 4, LOCAL_GET, tBase + 5);
	emitShuffle(c, SHUF_D);
	c.push(LOCAL_SET, mBase + wg * 4 + 1);
	c.push(LOCAL_GET, tBase + 6, LOCAL_GET, tBase + 7);
	emitShuffle(c, SHUF_C);
	c.push(LOCAL_SET, mBase + wg * 4 + 2);
	c.push(LOCAL_GET, tBase + 6, LOCAL_GET, tBase + 7);
	emitShuffle(c, SHUF_D);
	c.push(LOCAL_SET, mBase + wg * 4 + 3);
}

/**
 * Emit un-transpose of 8 CV v128 locals (word-major) into 4 lane-major CVs,
 * stored at address in local(dstLocal) - CV j at dst + j*32.
 * s locals sBase..sBase+7 hold words 0..7 across lanes; t temps at tBase (4 used).
 */
function emitUntransposeStore(c: Code, sBase: number, tBase: number, dstLocal: number): void {
	for (let group = 0; group < 2; group++) {
		const s0 = sBase + group * 4;
		const byteOff = group * 16;
		c.push(LOCAL_GET, s0, LOCAL_GET, s0 + 1);
		emitShuffle(c, SHUF_A);
		c.push(LOCAL_SET, tBase);
		c.push(LOCAL_GET, s0 + 2, LOCAL_GET, s0 + 3);
		emitShuffle(c, SHUF_A);
		c.push(LOCAL_SET, tBase + 1);
		c.push(LOCAL_GET, s0, LOCAL_GET, s0 + 1);
		emitShuffle(c, SHUF_B);
		c.push(LOCAL_SET, tBase + 2);
		c.push(LOCAL_GET, s0 + 2, LOCAL_GET, s0 + 3);
		emitShuffle(c, SHUF_B);
		c.push(LOCAL_SET, tBase + 3);

		// row j = words [group*4..group*4+3] of cv j -> store at dst + j*32 + group*16
		c.push(LOCAL_GET, dstLocal, LOCAL_GET, tBase, LOCAL_GET, tBase + 1);
		emitShuffle(c, SHUF_C);
		emitV128Store(c, byteOff);
		c.push(LOCAL_GET, dstLocal, LOCAL_GET, tBase, LOCAL_GET, tBase + 1);
		emitShuffle(c, SHUF_D);
		emitV128Store(c, 32 + byteOff);
		c.push(LOCAL_GET, dstLocal, LOCAL_GET, tBase + 2, LOCAL_GET, tBase + 3);
		emitShuffle(c, SHUF_C);
		emitV128Store(c, 64 + byteOff);
		c.push(LOCAL_GET, dstLocal, LOCAL_GET, tBase + 2, LOCAL_GET, tBase + 3);
		emitShuffle(c, SHUF_D);
		emitV128Store(c, 96 + byteOff);
	}
}

// ===== Function bodies =====

/**
 * Function 0: compressScalar(msgPtr, cvPtr, outPtr, counterLo, blockLen, flags)
 * Single scalar compression; writes 8 output words (cv-style) to outPtr.
 */
function buildCompressScalar(): Code {
	const c: Code = [];
	// locals: 32 x i32 (m0-15 at 6..21, s0-15 at 22..37)
	c.push(0x01, 0x20, 0x7f);
	const M = 6;
	const S = 22;

	for (let i = 0; i < 16; i++) {
		c.push(LOCAL_GET, 0);
		emitI32Load(c, i * 4);
		c.push(LOCAL_SET, M + i);
	}
	for (let i = 0; i < 8; i++) {
		c.push(LOCAL_GET, 1);
		emitI32Load(c, i * 4);
		c.push(LOCAL_SET, S + i);
	}
	for (let i = 0; i < 4; i++) {
		emitI32Const(c, IV[i]);
		c.push(LOCAL_SET, S + 8 + i);
	}
	c.push(LOCAL_GET, 3, LOCAL_SET, S + 12); // counter low
	emitI32Const(c, 0);
	c.push(LOCAL_SET, S + 13); // counter high = 0
	c.push(LOCAL_GET, 4, LOCAL_SET, S + 14); // block len
	c.push(LOCAL_GET, 5, LOCAL_SET, S + 15); // flags

	emitScalarRounds(c, S, M);

	for (let i = 0; i < 8; i++) {
		c.push(LOCAL_GET, 2, LOCAL_GET, S + i, LOCAL_GET, S + 8 + i, I32_XOR);
		emitI32Store(c, i * 4);
	}
	c.push(END);
	return c;
}

/**
 * Function 1: chunkScalar(inPtr, len, counterLo, extraFlags, outPtr)
 * Compress one whole chunk (0..1024 bytes, zero-padded to 64B in memory)
 * block by block, writing the resulting CV (or root output) to outPtr.
 * extraFlags (e.g. ROOT) is OR-ed into the final block's flags.
 */
function buildChunkScalar(): Code {
	const c: Code = [];
	// locals: 5 x i32 - lastIdx=5, lastLen=6, b=7, cvPtr=8, baseFlags=9
	c.push(0x01, 0x05, 0x7f);

	// if (len != 0) { lastIdx = (len-1)>>6; lastLen = len - (lastIdx<<6); }
	c.push(LOCAL_GET, 1, IF, VOID);
	c.push(LOCAL_GET, 1, I32_CONST, 1, I32_SUB, I32_CONST, 6, I32_SHR_U, LOCAL_SET, 5);
	c.push(LOCAL_GET, 1, LOCAL_GET, 5, I32_CONST, 6, I32_SHL, I32_SUB, LOCAL_SET, 6);
	c.push(END);

	// baseFlags = mem[FLAGS]
	emitI32Const(c, FLAGS_OFF);
	emitI32Load(c, 0);
	c.push(LOCAL_SET, 9);
	// cvPtr = KEY_OFF (0) - default local value is already 0

	c.push(BLOCK, VOID, LOOP, VOID);
	{
		// --- push call args for compressScalar ---
		// msgPtr = inPtr + (b << 6)
		c.push(LOCAL_GET, 0, LOCAL_GET, 7, I32_CONST, 6, I32_SHL, I32_ADD);
		// cvPtr
		c.push(LOCAL_GET, 8);
		// outPtr = (b == lastIdx) ? outPtr : SCRATCH
		c.push(LOCAL_GET, 4);
		emitI32Const(c, SCRATCH_OFF);
		c.push(LOCAL_GET, 7, LOCAL_GET, 5, I32_EQ, SELECT);
		// counterLo
		c.push(LOCAL_GET, 2);
		// blockLen = (b == lastIdx) ? lastLen : 64
		c.push(LOCAL_GET, 6);
		emitI32Const(c, 64);
		c.push(LOCAL_GET, 7, LOCAL_GET, 5, I32_EQ, SELECT);
		// flags = baseFlags | (b==0 ? CHUNK_START : 0) | (b==lastIdx ? CHUNK_END|extra : 0)
		c.push(LOCAL_GET, 9);
		c.push(LOCAL_GET, 7, I32_EQZ, I32_OR);
		emitI32Const(c, 2);
		c.push(LOCAL_GET, 3, I32_OR);
		emitI32Const(c, 0);
		c.push(LOCAL_GET, 7, LOCAL_GET, 5, I32_EQ, SELECT, I32_OR);
		c.push(CALL, 0x00);

		// cvPtr = SCRATCH
		emitI32Const(c, SCRATCH_OFF);
		c.push(LOCAL_SET, 8);
		// b++; continue while b <= lastIdx
		c.push(LOCAL_GET, 7, I32_CONST, 1, I32_ADD, LOCAL_TEE, 7);
		c.push(LOCAL_GET, 5, I32_LE_U, BR_IF, 0x00);
	}
	c.push(END, END);
	c.push(END);
	return c;
}

/**
 * Function 2: leafGroup(inPtr, counterLo, cvOutPtr)
 * Compress 4 consecutive FULL chunks (4096 bytes) 4-wide, writing 4
 * lane-major CVs (128 bytes) to cvOutPtr. Message transposition happens
 * in-register via shuffles.
 */
function buildLeafGroup(): Code {
	const c: Code = [];
	// locals: 3 x i32 (pos=3, addr=4, flagsBase=5), 41 x v128 ($6..$46)
	c.push(0x02, 0x03, 0x7f, 0x29, 0x7b);
	const M = 6; // m0-15: 6..21
	const S = 22; // s0-15: 22..37
	const T = 38; // t0-7: 38..45
	const CTR = 46;

	// flagsBase = mem[FLAGS]
	emitI32Const(c, FLAGS_OFF);
	emitI32Load(c, 0);
	c.push(LOCAL_SET, 5);
	// ctrVec = splat(counterLo) + [0,1,2,3]
	c.push(LOCAL_GET, 1, ...V_SPLAT);
	emitV128Const(c, [0, 0, 0, 0, 1, 0, 0, 0, 2, 0, 0, 0, 3, 0, 0, 0]);
	c.push(...V_ADD, LOCAL_SET, CTR);
	// s0..s7 = splat(key[i]) - the CV carries across all 16 blocks
	for (let i = 0; i < 8; i++) {
		emitI32Const(c, KEY_OFF);
		emitI32Load(c, i * 4);
		c.push(...V_SPLAT, LOCAL_SET, S + i);
	}
	// pos = 0
	emitI32Const(c, 0);
	c.push(LOCAL_SET, 3);

	c.push(BLOCK, VOID, LOOP, VOID);
	{
		// addr = inPtr + (pos << 6)
		c.push(LOCAL_GET, 0, LOCAL_GET, 3, I32_CONST, 6, I32_SHL, I32_ADD, LOCAL_SET, 4);
		// load + transpose 16 message words (lane stride = 1024)
		for (let wg = 0; wg < 4; wg++) {
			emitTransposedLoad(c, 4, 1024, wg, M, T);
		}
		// s8..s11 = IV[0..3]
		for (let i = 0; i < 4; i++) {
			emitV128Const(c, splatBytes(IV[i]));
			c.push(LOCAL_SET, S + 8 + i);
		}
		// s12 = ctrVec, s13 = 0, s14 = 64
		c.push(LOCAL_GET, CTR, LOCAL_SET, S + 12);
		emitV128Const(c, new Array(16).fill(0));
		c.push(LOCAL_SET, S + 13);
		emitV128Const(c, splatBytes(64));
		c.push(LOCAL_SET, S + 14);
		// s15 = splat(flagsBase | (pos==0 ? CHUNK_START : 0) | (pos==15 ? CHUNK_END : 0))
		c.push(LOCAL_GET, 5);
		c.push(LOCAL_GET, 3, I32_EQZ);
		c.push(LOCAL_GET, 3, I32_CONST, 15, I32_EQ, I32_CONST, 1, I32_SHL);
		c.push(I32_OR, I32_OR, ...V_SPLAT, LOCAL_SET, S + 15);

		emitVecRounds(c, S, M);

		// cv[i] = s[i] ^ s[i+8]
		for (let i = 0; i < 8; i++) {
			c.push(LOCAL_GET, S + i, LOCAL_GET, S + 8 + i, ...V_XOR, LOCAL_SET, S + i);
		}
		// pos++; loop while pos < 16
		c.push(LOCAL_GET, 3, I32_CONST, 1, I32_ADD, LOCAL_TEE, 3);
		c.push(I32_CONST, 16, I32_LT_U, BR_IF, 0x00);
	}
	c.push(END, END);

	emitUntransposeStore(c, S, T, 2);
	c.push(END);
	return c;
}

/**
 * Function 3: parentGroup(srcPtr, dstPtr)
 * Compress 4 parent nodes 4-wide: reads 4 x 64-byte parent blocks (8 CVs,
 * 256 bytes) from srcPtr, writes 4 lane-major CVs (128 bytes) to dstPtr.
 */
function buildParentGroup(): Code {
	const c: Code = [];
	// locals: 40 x v128 ($2..$41)
	c.push(0x01, 0x28, 0x7b);
	const M = 2; // 2..17
	const S = 18; // 18..33
	const T = 34; // 34..41

	// load + transpose messages (lane stride = 64); addr local = param 0
	for (let wg = 0; wg < 4; wg++) {
		emitTransposedLoad(c, 0, 64, wg, M, T);
	}
	// s0..s7 = splat(key[i])
	for (let i = 0; i < 8; i++) {
		emitI32Const(c, KEY_OFF);
		emitI32Load(c, i * 4);
		c.push(...V_SPLAT, LOCAL_SET, S + i);
	}
	// s8..s11 = IV[0..3]
	for (let i = 0; i < 4; i++) {
		emitV128Const(c, splatBytes(IV[i]));
		c.push(LOCAL_SET, S + 8 + i);
	}
	// s12 = 0, s13 = 0, s14 = 64
	emitV128Const(c, new Array(16).fill(0));
	c.push(LOCAL_SET, S + 12);
	emitV128Const(c, new Array(16).fill(0));
	c.push(LOCAL_SET, S + 13);
	emitV128Const(c, splatBytes(64));
	c.push(LOCAL_SET, S + 14);
	// s15 = splat(mem[FLAGS] | PARENT)
	emitI32Const(c, FLAGS_OFF);
	emitI32Load(c, 0);
	emitI32Const(c, 4);
	c.push(I32_OR, ...V_SPLAT, LOCAL_SET, S + 15);

	emitVecRounds(c, S, M);

	for (let i = 0; i < 8; i++) {
		c.push(LOCAL_GET, S + i, LOCAL_GET, S + 8 + i, ...V_XOR, LOCAL_SET, S + i);
	}
	emitUntransposeStore(c, S, T, 1);
	c.push(END);
	return c;
}

/**
 * Function 4: hashOneShot(inputLen)
 * Full BLAKE3 of mem[INPUT .. INPUT+inputLen) with key/flags from memory.
 * Writes the 32-byte root hash to mem[OUT].
 */
function buildHashOneShot(): Code {
	const c: Code = [];
	// locals: 7 x i32 - nf=1, rem=2, nc=3, i=4, cvCount=5, pairs=6, odd=7
	c.push(0x01, 0x07, 0x7f);

	// nf = len >> 10; rem = len & 1023; nc = nf + (rem != 0)
	c.push(LOCAL_GET, 0, I32_CONST, 10, I32_SHR_U, LOCAL_SET, 1);
	c.push(LOCAL_GET, 0);
	emitI32Const(c, 1023);
	c.push(I32_AND, LOCAL_SET, 2);
	c.push(LOCAL_GET, 1, LOCAL_GET, 2, I32_CONST, 0, I32_NE, I32_ADD, LOCAL_SET, 3);

	// single-chunk (or empty) message: scalar chunk with ROOT
	c.push(LOCAL_GET, 3, I32_CONST, 2, I32_LT_U, IF, VOID);
	emitI32Const(c, INPUT_OFF);
	c.push(LOCAL_GET, 0);
	emitI32Const(c, 0);
	emitI32Const(c, 8); // ROOT
	emitI32Const(c, OUT_OFF);
	c.push(CALL, 0x01, RETURN);
	c.push(END);

	// === leaves, 4-wide ===
	// i = 0
	emitI32Const(c, 0);
	c.push(LOCAL_SET, 4);
	c.push(BLOCK, VOID, LOOP, VOID);
	{
		c.push(LOCAL_GET, 4, I32_CONST, 4, I32_ADD, LOCAL_GET, 1, I32_GT_U, BR_IF, 0x01);
		emitI32Const(c, INPUT_OFF);
		c.push(LOCAL_GET, 4, I32_CONST, 10, I32_SHL, I32_ADD);
		c.push(LOCAL_GET, 4);
		emitI32Const(c, CV_ARR_OFF);
		c.push(LOCAL_GET, 4, I32_CONST, 5, I32_SHL, I32_ADD);
		c.push(CALL, 0x02);
		c.push(LOCAL_GET, 4, I32_CONST, 4, I32_ADD, LOCAL_SET, 4);
		c.push(BR, 0x00);
	}
	c.push(END, END);
	// tail of full chunks (1-3 remaining): run one more 4-wide group; the
	// extra lanes read past the valid input (capacity guaranteed by JS) and
	// their CVs are either never read or overwritten by the partial chunk below.
	c.push(LOCAL_GET, 4, LOCAL_GET, 1, I32_LT_U, IF, VOID);
	emitI32Const(c, INPUT_OFF);
	c.push(LOCAL_GET, 4, I32_CONST, 10, I32_SHL, I32_ADD);
	c.push(LOCAL_GET, 4);
	emitI32Const(c, CV_ARR_OFF);
	c.push(LOCAL_GET, 4, I32_CONST, 5, I32_SHL, I32_ADD);
	c.push(CALL, 0x02);
	c.push(END);
	// trailing partial chunk (scalar)
	c.push(LOCAL_GET, 2, IF, VOID);
	emitI32Const(c, INPUT_OFF);
	c.push(LOCAL_GET, 1, I32_CONST, 10, I32_SHL, I32_ADD);
	c.push(LOCAL_GET, 2);
	c.push(LOCAL_GET, 1);
	emitI32Const(c, 0);
	emitI32Const(c, CV_ARR_OFF);
	c.push(LOCAL_GET, 1, I32_CONST, 5, I32_SHL, I32_ADD);
	c.push(CALL, 0x01);
	c.push(END);

	// === merge levels (pairwise, odd CV carries up) ===
	c.push(LOCAL_GET, 3, LOCAL_SET, 5); // cvCount = nc
	c.push(BLOCK, VOID, LOOP, VOID);
	{
		c.push(LOCAL_GET, 5, I32_CONST, 2, I32_LE_U, BR_IF, 0x01);
		c.push(LOCAL_GET, 5, I32_CONST, 1, I32_SHR_U, LOCAL_SET, 6); // pairs
		c.push(LOCAL_GET, 5, I32_CONST, 1, I32_AND, LOCAL_SET, 7); // odd
		emitI32Const(c, 0);
		c.push(LOCAL_SET, 4);
		// 4-wide parents
		c.push(BLOCK, VOID, LOOP, VOID);
		{
			c.push(LOCAL_GET, 4, I32_CONST, 4, I32_ADD, LOCAL_GET, 6, I32_GT_U, BR_IF, 0x01);
			emitI32Const(c, CV_ARR_OFF);
			c.push(LOCAL_GET, 4, I32_CONST, 6, I32_SHL, I32_ADD);
			emitI32Const(c, CV_ARR_OFF);
			c.push(LOCAL_GET, 4, I32_CONST, 5, I32_SHL, I32_ADD);
			c.push(CALL, 0x03);
			c.push(LOCAL_GET, 4, I32_CONST, 4, I32_ADD, LOCAL_SET, 4);
			c.push(BR, 0x00);
		}
		c.push(END, END);
		// scalar tail parents
		c.push(BLOCK, VOID, LOOP, VOID);
		{
			c.push(LOCAL_GET, 4, LOCAL_GET, 6, I32_GE_U, BR_IF, 0x01);
			emitI32Const(c, CV_ARR_OFF);
			c.push(LOCAL_GET, 4, I32_CONST, 6, I32_SHL, I32_ADD); // msg = CV_ARR + i*64
			emitI32Const(c, KEY_OFF); // cv = key
			emitI32Const(c, CV_ARR_OFF);
			c.push(LOCAL_GET, 4, I32_CONST, 5, I32_SHL, I32_ADD); // out = CV_ARR + i*32
			emitI32Const(c, 0); // counter
			emitI32Const(c, 64); // blockLen
			emitI32Const(c, FLAGS_OFF);
			emitI32Load(c, 0);
			emitI32Const(c, 4);
			c.push(I32_OR); // flags | PARENT
			c.push(CALL, 0x00);
			c.push(LOCAL_GET, 4, I32_CONST, 1, I32_ADD, LOCAL_SET, 4);
			c.push(BR, 0x00);
		}
		c.push(END, END);
		// odd: carry last CV up - copy CV[cvCount-1] to CV[pairs]
		c.push(LOCAL_GET, 7, IF, VOID);
		for (let half = 0; half < 2; half++) {
			emitI32Const(c, CV_ARR_OFF);
			c.push(LOCAL_GET, 6, I32_CONST, 5, I32_SHL, I32_ADD);
			emitI32Const(c, CV_ARR_OFF);
			c.push(LOCAL_GET, 5, I32_CONST, 1, I32_SUB, I32_CONST, 5, I32_SHL, I32_ADD);
			emitV128Load(c, half * 16);
			emitV128Store(c, half * 16);
		}
		c.push(END);
		// cvCount = pairs + odd
		c.push(LOCAL_GET, 6, LOCAL_GET, 7, I32_ADD, LOCAL_SET, 5);
		c.push(BR, 0x00);
	}
	c.push(END, END);

	// root = parent(CV[0], CV[1]) with ROOT flag
	emitI32Const(c, CV_ARR_OFF);
	emitI32Const(c, KEY_OFF);
	emitI32Const(c, OUT_OFF);
	emitI32Const(c, 0);
	emitI32Const(c, 64);
	emitI32Const(c, FLAGS_OFF);
	emitI32Load(c, 0);
	emitI32Const(c, 12); // PARENT | ROOT
	c.push(I32_OR);
	c.push(CALL, 0x00);
	c.push(END);
	return c;
}

// ===== Module assembly =====

function generateOneShotWasm(): Uint8Array {
	const code: Code = [];

	function put(bytes: number[]): void {
		for (let i = 0; i < bytes.length; i++) {code.push(bytes[i]);}
	}

	function section(id: number, contents: number[]): void {
		put([id, ...lebU(contents.length), ...contents]);
	}

	put([0x00, 0x61, 0x73, 0x6d]); // magic
	put([0x01, 0x00, 0x00, 0x00]); // version

	// Types
	const types: Code = [];
	types.push(0x05); // 5 types
	const paramCounts = [6, 5, 3, 2, 1];
	for (const n of paramCounts) {
		types.push(0x60, n);
		for (let i = 0; i < n; i++) {types.push(0x7f);}
		types.push(0x00);
	}
	section(0x01, types);

	// Imports: memory js.mem
	section(0x02, [0x01, 0x02, 0x6a, 0x73, 0x03, 0x6d, 0x65, 0x6d, 0x02, 0x00, INITIAL_PAGES]);

	// Functions
	section(0x03, [0x05, 0x00, 0x01, 0x02, 0x03, 0x04]);

	// Exports: hashOneShot -> func 4
	const name = "hashOneShot";
	const exp: Code = [0x01, name.length];
	for (let i = 0; i < name.length; i++) {exp.push(name.charCodeAt(i));}
	exp.push(0x00, 0x04);
	section(0x07, exp);

	// Code section
	const bodies = [buildCompressScalar(), buildChunkScalar(), buildLeafGroup(), buildParentGroup(), buildHashOneShot()];
	const codeSec: Code = [0x05];
	for (const body of bodies) {
		codeSec.push(...lebUPadded5(body.length));
		for (let i = 0; i < body.length; i++) {codeSec.push(body[i]);}
	}
	section(0x0a, codeSec);

	return new Uint8Array(code);
}

// ===== JS runtime wrapper =====

const IS_LE = new Uint8Array(new Uint32Array([0x01020304]).buffer)[0] === 0x04;

let memory: WebAssembly.Memory | null = null;
let hashFn: ((len: number) => void) | null = null;
let view8: Uint8Array = new Uint8Array(0);
let view32: Uint32Array = new Uint32Array(0);
let initFailed = false;

function refreshViews(): void {
	if (!memory) {return;}
	view8 = new Uint8Array(memory.buffer);
	view32 = new Uint32Array(memory.buffer);
}

/**
 * Initialize the one-shot engine (idempotent). Returns availability.
 */
export function initOneShot(): boolean {
	if (hashFn) {return true;}
	if (initFailed || !IS_LE) {return false;}
	try {
		if (
			typeof WebAssembly === "undefined" ||
			!WebAssembly.validate(generateSimdProbe()) // SIMD support check
		) {
			initFailed = true;
			return false;
		}
		const bytes = generateOneShotWasm();
		memory = new WebAssembly.Memory({ initial: INITIAL_PAGES });
		const module = new WebAssembly.Module(bytes.buffer as ArrayBuffer);
		const instance = new WebAssembly.Instance(module, { js: { mem: memory } });
		hashFn = instance.exports.hashOneShot as (len: number) => void;
		refreshViews();
		return true;
	} catch {
		initFailed = true;
		memory = null;
		hashFn = null;
		return false;
	}
}

// Minimal SIMD-support probe module: () -> v128 with v128.const
function generateSimdProbe(): Uint8Array {
	// prettier-ignore
	return new Uint8Array([
    0x00, 0x61, 0x73, 0x6d, 0x01, 0x00, 0x00, 0x00,
    0x01, 0x05, 0x01, 0x60, 0x00, 0x01, 0x7b,
    0x03, 0x02, 0x01, 0x00,
    0x0a, 0x16, 0x01, 0x14, 0x00, 0xfd, 0x0c,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x0b,
  ]);
}

function ensureCapacity(totalBytes: number): void {
	if (view8.length >= totalBytes) {return;}
	const pages = Math.ceil((totalBytes - view8.length) / PAGE_SIZE);
	(memory as WebAssembly.Memory).grow(pages);
	refreshViews();
}

// Extra readable/writable slack past the input: the 4-wide leaf tail may
// read up to 3 chunks past the end of the message.
const INPUT_SLACK = 4096 + 64;

/**
 * Ownership of the wasm input staging area. Hashers buffer their message
 * bytes directly in wasm memory; when another hasher (or a one-shot hash
 * call) needs the area, the current owner is evicted and replays its
 * buffered bytes through the scalar path.
 */
export interface OneShotOwner {
	evictOneShot(): void;
}

let inputOwner: OneShotOwner | null = null;

export function claimInput(owner: OneShotOwner | null): void {
	if (inputOwner === owner) {return;}
	const prev = inputOwner;
	inputOwner = owner;
	if (prev) {prev.evictOneShot();}
}

/**
 * Append message bytes into the wasm input staging area at `offset`.
 */
export function appendInput(data: Uint8Array, offset: number): void {
	ensureCapacity(INPUT_OFF + offset + data.length + INPUT_SLACK);
	view8.set(data, INPUT_OFF + offset);
}

/**
 * View over currently buffered input (valid until next append/grow).
 */
export function bufferedInput(len: number): Uint8Array {
	return view8.subarray(INPUT_OFF, INPUT_OFF + len);
}

/**
 * Run the full hash over the buffered input and copy out the root hash.
 */
export function runOneShot(keyWords: Uint32Array, flags: number, len: number, out: Uint8Array, outLen: number): void {
	ensureCapacity(INPUT_OFF + len + INPUT_SLACK);
	view32.set(keyWords, 0);
	view32[FLAGS_OFF >> 2] = flags;
	// zero-pad the final block (wasm always reads full 64-byte blocks)
	const padEnd = INPUT_OFF + ((len + 63) & ~63 || 64);
	view8.fill(0, INPUT_OFF + len, padEnd);
	(hashFn as (len: number) => void)(len);
	out.set(view8.subarray(OUT_OFF, OUT_OFF + outLen));
}

/**
 * Whether the engine is ready (must call initOneShot() first).
 */
export function oneShotReady(): boolean {
	return hashFn !== null;
}
