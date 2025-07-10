// Constants from the reference implementation
const OUT_LEN: i32 = 32;
const BLOCK_LEN: i32 = 64;
const CHUNK_LEN: i32 = 1024;
const DEGREE: i32 = 4; // Process 4 hashes in parallel

const CHUNK_START: u32 = 1 << 0;
const CHUNK_END: u32 = 1 << 1;
const PARENT: u32 = 1 << 2;
const ROOT: u32 = 1 << 3;
const KEYED_HASH: u32 = 1 << 4;

const IV: StaticArray<u32> = [
	0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19,
];

// SIMD helper functions
@inline
function loadu(src: usize): v128 {
	return v128.load(src);
}

@inline
function storeu(src: v128, dest: usize): void {
	v128.store(dest, src);
}

@inline
function add(a: v128, b: v128): v128 {
	return v128.add<u32>(a, b);
}

@inline
function xor(a: v128, b: v128): v128 {
	return v128.xor(a, b);
}

@inline
function set1(x: u32): v128 {
	return v128.splat<u32>(x);
}

@inline
function set4(a: u32, b: u32, c: u32, d: u32): v128 {
  const ret = v128.splat<u32>(0);
  v128.replace_lane<u32>(ret, 0, a);
  v128.replace_lane<u32>(ret, 1, b);
  v128.replace_lane<u32>(ret, 2, c);
  v128.replace_lane<u32>(ret, 3, d);
  return ret;
}

// Rotation functions using shifts
@inline
function rot16(a: v128): v128 {
	return v128.or(v128.shr<u32>(a, 16), v128.shl<u32>(a, 32 - 16));
}

@inline
function rot12(a: v128): v128 {
	return v128.or(v128.shr<u32>(a, 12), v128.shl<u32>(a, 32 - 12));
}

@inline
function rot8(a: v128): v128 {
	return v128.or(v128.shr<u32>(a, 8), v128.shl<u32>(a, 32 - 8));
}

@inline
function rot7(a: v128): v128 {
	return v128.or(v128.shr<u32>(a, 7), v128.shl<u32>(a, 32 - 7));
}

// G mixing functions
@inline
function g1(row0: v128, row1: v128, row2: v128, row3: v128, m: v128): StaticArray<v128> {
	const new_row0 = add(add(row0, m), row1);
	const new_row3 = xor(row3, new_row0);
	const new_row3_rot = rot16(new_row3);
	const new_row2 = add(row2, new_row3_rot);
	const new_row1 = xor(row1, new_row2);
	const new_row1_rot = rot12(new_row1);
	
	const result = new StaticArray<v128>(4);
	result[0] = new_row0;
	result[1] = new_row1_rot;
	result[2] = new_row2;
	result[3] = new_row3_rot;
	return result;
}

@inline
function g2(row0: v128, row1: v128, row2: v128, row3: v128, m: v128): StaticArray<v128> {
	const new_row0 = add(add(row0, m), row1);
	const new_row3 = xor(row3, new_row0);
	const new_row3_rot = rot8(new_row3);
	const new_row2 = add(row2, new_row3_rot);
	const new_row1 = xor(row1, new_row2);
	const new_row1_rot = rot7(new_row1);
	
	const result = new StaticArray<v128>(4);
	result[0] = new_row0;
	result[1] = new_row1_rot;
	result[2] = new_row2;
	result[3] = new_row3_rot;
	return result;
}

// Shuffle functions
@inline
function unpacklo_epi64(a: v128, b: v128): v128 {
	return v128.shuffle<u64>(a, b, 0, 2);
}

@inline
function unpackhi_epi64(a: v128, b: v128): v128 {
	return v128.shuffle<u64>(a, b, 1, 3);
}

@inline
function unpacklo_epi32(a: v128, b: v128): v128 {
	return v128.shuffle<u32>(a, b, 0, 4, 1, 5);
}

@inline
function unpackhi_epi32(a: v128, b: v128): v128 {
	return v128.shuffle<u32>(a, b, 2, 6, 3, 7);
}

@inline
function blend_epi16(a: v128, b: v128, imm8: i32): v128 {
	const bits = i16x8(0x01, 0x02, 0x04, 0x08, 0x10, 0x20, 0x40, 0x80);
	let mask = v128.splat<u16>(imm8 as u16);
	mask = v128.and(mask, bits);
	mask = v128.eq<u16>(mask, bits);
	return v128.bitselect(b, a, mask);
}

// Diagonalization functions
@inline
function diagonalize(row0: v128, row2: v128, row3: v128): StaticArray<v128> {
	const new_row0 = v128.shuffle<u32>(row0, row0, 3, 0, 1, 2);
	const new_row3 = v128.shuffle<u32>(row3, row3, 2, 3, 0, 1);
	const new_row2 = v128.shuffle<u32>(row2, row2, 1, 2, 3, 0);
	
	const result = new StaticArray<v128>(3);
	result[0] = new_row0;
	result[1] = new_row2;
	result[2] = new_row3;
	return result;
}

@inline
function undiagonalize(row0: v128, row2: v128, row3: v128): StaticArray<v128> {
	const new_row0 = v128.shuffle<u32>(row0, row0, 1, 2, 3, 0);
	const new_row3 = v128.shuffle<u32>(row3, row3, 2, 3, 0, 1);
	const new_row2 = v128.shuffle<u32>(row2, row2, 3, 0, 1, 2);
	
	const result = new StaticArray<v128>(3);
	result[0] = new_row0;
	result[1] = new_row2;
	result[2] = new_row3;
	return result;
}

// SIMD compress function
function compress_pre_simd(
	cv: Uint32Array,
	block: Uint8Array,
	block_len: u8,
	counter: u64,
	flags: u8
): StaticArray<v128> {
	// Load CV as v128 vectors
	const row0 = loadu(cv.dataStart);
	const row1 = loadu(cv.dataStart + 16);
	const row2 = set4(IV[0], IV[1], IV[2], IV[3]);
	const row3 = set4(
		(counter as u32),
		((counter >> 32) as u32),
		block_len as u32,
		flags as u32
	);

	// Load message blocks
	let m0 = loadu(block.dataStart + 0 * 4 * DEGREE);
	let m1 = loadu(block.dataStart + 1 * 4 * DEGREE);
	let m2 = loadu(block.dataStart + 2 * 4 * DEGREE);
	let m3 = loadu(block.dataStart + 3 * 4 * DEGREE);

	let t0: v128;
	let t1: v128;
	let t2: v128;
	let t3: v128;
	let tt: v128;

	// Round 1
	t0 = v128.shuffle<u32>(m0, m1, 0, 2, 4, 6);
	let g1_result = g1(row0, row1, row2, row3, t0);
	let mut_row0 = g1_result[0];
	let mut_row1 = g1_result[1];
	let mut_row2 = g1_result[2];
	let mut_row3 = g1_result[3];
	
	t1 = v128.shuffle<u32>(m0, m1, 1, 3, 5, 7);
	let g2_result = g2(mut_row0, mut_row1, mut_row2, mut_row3, t1);
	mut_row0 = g2_result[0];
	mut_row1 = g2_result[1];
	mut_row2 = g2_result[2];
	mut_row3 = g2_result[3];
	
	let diag_result = diagonalize(mut_row0, mut_row2, mut_row3);
	mut_row0 = diag_result[0];
	mut_row2 = diag_result[1];
	mut_row3 = diag_result[2];
	
	t2 = v128.shuffle<u32>(m2, m3, 0, 2, 4, 6);
	t2 = v128.shuffle<u32>(t2, t2, 3, 0, 1, 2);
	g1_result = g1(mut_row0, mut_row1, mut_row2, mut_row3, t2);
	mut_row0 = g1_result[0];
	mut_row1 = g1_result[1];
	mut_row2 = g1_result[2];
	mut_row3 = g1_result[3];
	
	t3 = v128.shuffle<u32>(m2, m3, 1, 3, 5, 7);
	t3 = v128.shuffle<u32>(t3, t3, 3, 0, 1, 2);
	g2_result = g2(mut_row0, mut_row1, mut_row2, mut_row3, t3);
	mut_row0 = g2_result[0];
	mut_row1 = g2_result[1];
	mut_row2 = g2_result[2];
	mut_row3 = g2_result[3];
	
	let undiag_result = undiagonalize(mut_row0, mut_row2, mut_row3);
	mut_row0 = undiag_result[0];
	mut_row2 = undiag_result[1];
	mut_row3 = undiag_result[2];
	
	m0 = t0;
	m1 = t1;
	m2 = t2;
	m3 = t3;

	// Round 2
	t0 = v128.shuffle<u32>(m0, m1, 2, 1, 1, 3);
	t0 = v128.shuffle<u32>(t0, t0, 1, 2, 3, 0);
	g1_result = g1(mut_row0, mut_row1, mut_row2, mut_row3, t0);
	mut_row0 = g1_result[0];
	mut_row1 = g1_result[1];
	mut_row2 = g1_result[2];
	mut_row3 = g1_result[3];
	
	t1 = v128.shuffle<u32>(m2, m3, 2, 2, 3, 3);
	tt = v128.shuffle<u32>(m0, m0, 3, 3, 0, 0);
	t1 = blend_epi16(tt, t1, 0xCC);
	g2_result = g2(mut_row0, mut_row1, mut_row2, mut_row3, t1);
	mut_row0 = g2_result[0];
	mut_row1 = g2_result[1];
	mut_row2 = g2_result[2];
	mut_row3 = g2_result[3];
	
	diag_result = diagonalize(mut_row0, mut_row2, mut_row3);
	mut_row0 = diag_result[0];
	mut_row2 = diag_result[1];
	mut_row3 = diag_result[2];
	
	t2 = unpacklo_epi64(m3, m1);
	tt = blend_epi16(t2, m2, 0xC0);
	t2 = v128.shuffle<u32>(tt, tt, 0, 2, 3, 1);
	g1_result = g1(mut_row0, mut_row1, mut_row2, mut_row3, t2);
	mut_row0 = g1_result[0];
	mut_row1 = g1_result[1];
	mut_row2 = g1_result[2];
	mut_row3 = g1_result[3];
	
	t3 = unpackhi_epi32(m1, m3);
	tt = unpacklo_epi32(m2, t3);
	t3 = v128.shuffle<u32>(tt, tt, 2, 3, 1, 0);
	g2_result = g2(mut_row0, mut_row1, mut_row2, mut_row3, t3);
	mut_row0 = g2_result[0];
	mut_row1 = g2_result[1];
	mut_row2 = g2_result[2];
	mut_row3 = g2_result[3];
	
	undiag_result = undiagonalize(mut_row0, mut_row2, mut_row3);
	mut_row0 = undiag_result[0];
	mut_row2 = undiag_result[1];
	mut_row3 = undiag_result[2];
	
	m0 = t0;
	m1 = t1;
	m2 = t2;
	m3 = t3;

	// Round 3
	t0 = v128.shuffle<u32>(m0, m1, 2, 1, 1, 3);
	t0 = v128.shuffle<u32>(t0, t0, 1, 2, 3, 0);
	g1_result = g1(mut_row0, mut_row1, mut_row2, mut_row3, t0);
	mut_row0 = g1_result[0];
	mut_row1 = g1_result[1];
	mut_row2 = g1_result[2];
	mut_row3 = g1_result[3];
	
	t1 = v128.shuffle<u32>(m2, m3, 2, 2, 3, 3);
	tt = v128.shuffle<u32>(m0, m0, 3, 3, 0, 0);
	t1 = blend_epi16(tt, t1, 0xCC);
	g2_result = g2(mut_row0, mut_row1, mut_row2, mut_row3, t1);
	mut_row0 = g2_result[0];
	mut_row1 = g2_result[1];
	mut_row2 = g2_result[2];
	mut_row3 = g2_result[3];
	
	diag_result = diagonalize(mut_row0, mut_row2, mut_row3);
	mut_row0 = diag_result[0];
	mut_row2 = diag_result[1];
	mut_row3 = diag_result[2];
	
	t2 = unpacklo_epi64(m3, m1);
	tt = blend_epi16(t2, m2, 0xC0);
	t2 = v128.shuffle<u32>(tt, tt, 0, 2, 3, 1);
	g1_result = g1(mut_row0, mut_row1, mut_row2, mut_row3, t2);
	mut_row0 = g1_result[0];
	mut_row1 = g1_result[1];
	mut_row2 = g1_result[2];
	mut_row3 = g1_result[3];
	
	t3 = unpackhi_epi32(m1, m3);
	tt = unpacklo_epi32(m2, t3);
	t3 = v128.shuffle<u32>(tt, tt, 2, 3, 1, 0);
	g2_result = g2(mut_row0, mut_row1, mut_row2, mut_row3, t3);
	mut_row0 = g2_result[0];
	mut_row1 = g2_result[1];
	mut_row2 = g2_result[2];
	mut_row3 = g2_result[3];
	
	undiag_result = undiagonalize(mut_row0, mut_row2, mut_row3);
	mut_row0 = undiag_result[0];
	mut_row2 = undiag_result[1];
	mut_row3 = undiag_result[2];
	
	m0 = t0;
	m1 = t1;
	m2 = t2;
	m3 = t3;

	// Round 4
	t0 = v128.shuffle<u32>(m0, m1, 2, 1, 1, 3);
	t0 = v128.shuffle<u32>(t0, t0, 1, 2, 3, 0);
	g1_result = g1(mut_row0, mut_row1, mut_row2, mut_row3, t0);
	mut_row0 = g1_result[0];
	mut_row1 = g1_result[1];
	mut_row2 = g1_result[2];
	mut_row3 = g1_result[3];
	
	t1 = v128.shuffle<u32>(m2, m3, 2, 2, 3, 3);
	tt = v128.shuffle<u32>(m0, m0, 3, 3, 0, 0);
	t1 = blend_epi16(tt, t1, 0xCC);
	g2_result = g2(mut_row0, mut_row1, mut_row2, mut_row3, t1);
	mut_row0 = g2_result[0];
	mut_row1 = g2_result[1];
	mut_row2 = g2_result[2];
	mut_row3 = g2_result[3];
	
	diag_result = diagonalize(mut_row0, mut_row2, mut_row3);
	mut_row0 = diag_result[0];
	mut_row2 = diag_result[1];
	mut_row3 = diag_result[2];
	
	t2 = unpacklo_epi64(m3, m1);
	tt = blend_epi16(t2, m2, 0xC0);
	t2 = v128.shuffle<u32>(tt, tt, 0, 2, 3, 1);
	g1_result = g1(mut_row0, mut_row1, mut_row2, mut_row3, t2);
	mut_row0 = g1_result[0];
	mut_row1 = g1_result[1];
	mut_row2 = g1_result[2];
	mut_row3 = g1_result[3];
	
	t3 = unpackhi_epi32(m1, m3);
	tt = unpacklo_epi32(m2, t3);
	t3 = v128.shuffle<u32>(tt, tt, 2, 3, 1, 0);
	g2_result = g2(mut_row0, mut_row1, mut_row2, mut_row3, t3);
	mut_row0 = g2_result[0];
	mut_row1 = g2_result[1];
	mut_row2 = g2_result[2];
	mut_row3 = g2_result[3];
	
	undiag_result = undiagonalize(mut_row0, mut_row2, mut_row3);
	mut_row0 = undiag_result[0];
	mut_row2 = undiag_result[1];
	mut_row3 = undiag_result[2];
	
	m0 = t0;
	m1 = t1;
	m2 = t2;
	m3 = t3;

	// Round 5
	t0 = v128.shuffle<u32>(m0, m1, 2, 1, 1, 3);
	t0 = v128.shuffle<u32>(t0, t0, 1, 2, 3, 0);
	g1_result = g1(mut_row0, mut_row1, mut_row2, mut_row3, t0);
	mut_row0 = g1_result[0];
	mut_row1 = g1_result[1];
	mut_row2 = g1_result[2];
	mut_row3 = g1_result[3];
	
	t1 = v128.shuffle<u32>(m2, m3, 2, 2, 3, 3);
	tt = v128.shuffle<u32>(m0, m0, 3, 3, 0, 0);
	t1 = blend_epi16(tt, t1, 0xCC);
	g2_result = g2(mut_row0, mut_row1, mut_row2, mut_row3, t1);
	mut_row0 = g2_result[0];
	mut_row1 = g2_result[1];
	mut_row2 = g2_result[2];
	mut_row3 = g2_result[3];
	
	diag_result = diagonalize(mut_row0, mut_row2, mut_row3);
	mut_row0 = diag_result[0];
	mut_row2 = diag_result[1];
	mut_row3 = diag_result[2];
	
	t2 = unpacklo_epi64(m3, m1);
	tt = blend_epi16(t2, m2, 0xC0);
	t2 = v128.shuffle<u32>(tt, tt, 0, 2, 3, 1);
	g1_result = g1(mut_row0, mut_row1, mut_row2, mut_row3, t2);
	mut_row0 = g1_result[0];
	mut_row1 = g1_result[1];
	mut_row2 = g1_result[2];
	mut_row3 = g1_result[3];
	
	t3 = unpackhi_epi32(m1, m3);
	tt = unpacklo_epi32(m2, t3);
	t3 = v128.shuffle<u32>(tt, tt, 2, 3, 1, 0);
	g2_result = g2(mut_row0, mut_row1, mut_row2, mut_row3, t3);
	mut_row0 = g2_result[0];
	mut_row1 = g2_result[1];
	mut_row2 = g2_result[2];
	mut_row3 = g2_result[3];
	
	undiag_result = undiagonalize(mut_row0, mut_row2, mut_row3);
	mut_row0 = undiag_result[0];
	mut_row2 = undiag_result[1];
	mut_row3 = undiag_result[2];
	
	m0 = t0;
	m1 = t1;
	m2 = t2;
	m3 = t3;

	// Round 6
	t0 = v128.shuffle<u32>(m0, m1, 2, 1, 1, 3);
	t0 = v128.shuffle<u32>(t0, t0, 1, 2, 3, 0);
	g1_result = g1(mut_row0, mut_row1, mut_row2, mut_row3, t0);
	mut_row0 = g1_result[0];
	mut_row1 = g1_result[1];
	mut_row2 = g1_result[2];
	mut_row3 = g1_result[3];
	
	t1 = v128.shuffle<u32>(m2, m3, 2, 2, 3, 3);
	tt = v128.shuffle<u32>(m0, m0, 3, 3, 0, 0);
	t1 = blend_epi16(tt, t1, 0xCC);
	g2_result = g2(mut_row0, mut_row1, mut_row2, mut_row3, t1);
	mut_row0 = g2_result[0];
	mut_row1 = g2_result[1];
	mut_row2 = g2_result[2];
	mut_row3 = g2_result[3];
	
	diag_result = diagonalize(mut_row0, mut_row2, mut_row3);
	mut_row0 = diag_result[0];
	mut_row2 = diag_result[1];
	mut_row3 = diag_result[2];
	
	t2 = unpacklo_epi64(m3, m1);
	tt = blend_epi16(t2, m2, 0xC0);
	t2 = v128.shuffle<u32>(tt, tt, 0, 2, 3, 1);
	g1_result = g1(mut_row0, mut_row1, mut_row2, mut_row3, t2);
	mut_row0 = g1_result[0];
	mut_row1 = g1_result[1];
	mut_row2 = g1_result[2];
	mut_row3 = g1_result[3];
	
	t3 = unpackhi_epi32(m1, m3);
	tt = unpacklo_epi32(m2, t3);
	t3 = v128.shuffle<u32>(tt, tt, 2, 3, 1, 0);
	g2_result = g2(mut_row0, mut_row1, mut_row2, mut_row3, t3);
	mut_row0 = g2_result[0];
	mut_row1 = g2_result[1];
	mut_row2 = g2_result[2];
	mut_row3 = g2_result[3];
	
	undiag_result = undiagonalize(mut_row0, mut_row2, mut_row3);
	mut_row0 = undiag_result[0];
	mut_row2 = undiag_result[1];
	mut_row3 = undiag_result[2];
	
	m0 = t0;
	m1 = t1;
	m2 = t2;
	m3 = t3;

	// Round 7
	t0 = v128.shuffle<u32>(m0, m1, 2, 1, 1, 3);
	t0 = v128.shuffle<u32>(t0, t0, 1, 2, 3, 0);
	g1_result = g1(mut_row0, mut_row1, mut_row2, mut_row3, t0);
	mut_row0 = g1_result[0];
	mut_row1 = g1_result[1];
	mut_row2 = g1_result[2];
	mut_row3 = g1_result[3];
	
	t1 = v128.shuffle<u32>(m2, m3, 2, 2, 3, 3);
	tt = v128.shuffle<u32>(m0, m0, 3, 3, 0, 0);
	t1 = blend_epi16(tt, t1, 0xCC);
	g2_result = g2(mut_row0, mut_row1, mut_row2, mut_row3, t1);
	mut_row0 = g2_result[0];
	mut_row1 = g2_result[1];
	mut_row2 = g2_result[2];
	mut_row3 = g2_result[3];
	
	diag_result = diagonalize(mut_row0, mut_row2, mut_row3);
	mut_row0 = diag_result[0];
	mut_row2 = diag_result[1];
	mut_row3 = diag_result[2];
	
	t2 = unpacklo_epi64(m3, m1);
	tt = blend_epi16(t2, m2, 0xC0);
	t2 = v128.shuffle<u32>(tt, tt, 0, 2, 3, 1);
	g1_result = g1(mut_row0, mut_row1, mut_row2, mut_row3, t2);
	mut_row0 = g1_result[0];
	mut_row1 = g1_result[1];
	mut_row2 = g1_result[2];
	mut_row3 = g1_result[3];
	
	t3 = unpackhi_epi32(m1, m3);
	tt = unpacklo_epi32(m2, t3);
	t3 = v128.shuffle<u32>(tt, tt, 2, 3, 1, 0);
	g2_result = g2(mut_row0, mut_row1, mut_row2, mut_row3, t3);
	mut_row0 = g2_result[0];
	mut_row1 = g2_result[1];
	mut_row2 = g2_result[2];
	mut_row3 = g2_result[3];
	
	undiag_result = undiagonalize(mut_row0, mut_row2, mut_row3);
	mut_row0 = undiag_result[0];
	mut_row2 = undiag_result[1];
	mut_row3 = undiag_result[2];
	
	const result = new StaticArray<v128>(4);
	result[0] = mut_row0;
	result[1] = mut_row1;
	result[2] = mut_row2;
	result[3] = mut_row3;
	return result;
}

// SIMD compress in place
function compress_in_place_simd(
	cv: Uint32Array,
	block: Uint8Array,
	block_len: u8,
	counter: u64,
	flags: u8
): void {
	const state = compress_pre_simd(cv, block, block_len, counter, flags);
	
	// XOR the halves and store back to CV
	const xor_result0 = xor(state[0], state[2]);
	const xor_result1 = xor(state[1], state[3]);
	
	storeu(xor_result0, cv.dataStart);
	storeu(xor_result1, cv.dataStart + 16);
}

// SIMD compress for XOF
function compress_xof_simd(
	cv: Uint32Array,
	block: Uint8Array,
	block_len: u8,
	counter: u64,
	flags: u8
): Uint8Array {
	let state = compress_pre_simd(cv, block, block_len, counter, flags);
	
	state[0] = xor(state[0], state[2]);
	state[1] = xor(state[1], state[3]);
	state[2] = xor(state[2], loadu(cv.dataStart));
	state[3] = xor(state[3], loadu(cv.dataStart + 16));
	
	// Convert v128 back to bytes
	const result = new Uint8Array(64);
	storeu(state[0], result.dataStart);
	storeu(state[1], result.dataStart + 16);
	storeu(state[2], result.dataStart + 32);
	storeu(state[3], result.dataStart + 48);
	
	return result;
}

// SIMD hash4 function for processing 4 inputs in parallel
function hash4_simd(
	inputs: StaticArray<Uint8Array>,
	blocks: i32,
	key: Uint32Array,
	counter: u64,
	flags: u8,
	flags_start: u8,
	flags_end: u8,
	out: Uint8Array
): void {
	// Initialize h vectors with key values
	const h_vecs = new StaticArray<v128>(8);
	for (let i = 0; i < 8; i++) {
		h_vecs[i] = set1(key[i]);
	}
	
	let block_flags = flags | flags_start;
	
	for (let block = 0; block < blocks; block++) {
		if (block + 1 == blocks) {
			block_flags |= flags_end;
		}
		
		// Process 4 inputs in parallel
		// This is a simplified version - in practice you'd implement the full
		// transpose and parallel processing logic from the Rust implementation
		
		// For now, we'll process them sequentially but with SIMD operations
		for (let i = 0; i < DEGREE; i++) {
			const input_block = inputs[i].subarray(block * BLOCK_LEN, (block + 1) * BLOCK_LEN);
			const cv_copy = new Uint32Array(8);
			cv_copy.set(key);
			
			compress_in_place_simd(cv_copy, input_block, BLOCK_LEN as u8, counter, block_flags as u8);
			
			// Store result
      const dataView = new DataView(out.buffer);
			for (let j = 0; j < 8; j++) {
				const out_offset = i * OUT_LEN + j * 4;
				dataView.setUint32(out_offset, cv_copy[j], true);
			}
		}
		
		block_flags = flags;
	}
}

const DEFAULT_KEY_WORDS = new Uint32Array(8);
DEFAULT_KEY_WORDS[0] = IV[0];
DEFAULT_KEY_WORDS[1] = IV[1];
DEFAULT_KEY_WORDS[2] = IV[2];
DEFAULT_KEY_WORDS[3] = IV[3];
DEFAULT_KEY_WORDS[4] = IV[4];
DEFAULT_KEY_WORDS[5] = IV[5];
DEFAULT_KEY_WORDS[6] = IV[6];
DEFAULT_KEY_WORDS[7] = IV[7];

// SIMD Blake3 hasher class
class Blake3SimdHasher {
	private chunk_state: ChunkState;
	private key_words: Uint32Array;
	private cv_stack: StaticArray<Uint32Array>;
	private cv_stack_len: u8;
	private flags: u32;

	constructor(key_words: Uint32Array = DEFAULT_KEY_WORDS, flags: u32 = 0) {
		this.key_words = key_words;
		this.chunk_state = new ChunkState(key_words, 0, flags);
		this.cv_stack = new StaticArray<Uint32Array>(54);
		this.cv_stack_len = 0;
		this.flags = flags;

		for (let i = 0; i < 54; i++) {
			this.cv_stack[i] = new Uint32Array(8);
		}
	}

	static newKeyed(key: Uint8Array): Blake3SimdHasher {
		if (key.length != 32) {
			throw new Error("Key must be exactly 32 bytes");
		}

		const key_words = new Uint32Array(8);
		const dataView = new DataView(key.buffer);
		for (let i = 0; i < 8; i++) {
			key_words[i] = dataView.getUint32(i * 4, true);
		}

		return new Blake3SimdHasher(key_words, KEYED_HASH);
	}

	update(input: Uint8Array): void {
		let inputPos = 0;
		while (inputPos < input.length) {
			if (this.chunk_state.len() == CHUNK_LEN) {
				const chunk_cv = this.chunk_state.output().chaining_value();
				const total_chunks = this.chunk_state.chunk_counter + 1;
				this.add_chunk_chaining_value(chunk_cv, total_chunks);
				this.chunk_state = new ChunkState(this.key_words, total_chunks, this.flags);
			}

			const want = CHUNK_LEN - this.chunk_state.len();
			const take = min(want, input.length - inputPos);
			this.chunk_state.update(input.subarray(inputPos, inputPos + take));
			inputPos += take;
		}
	}

	finalize(out: Uint8Array): void {
		let output = this.chunk_state.output();
		let parent_nodes_remaining = this.cv_stack_len;

		while (parent_nodes_remaining > 0) {
			parent_nodes_remaining--;
			output = parent_output(
				this.cv_stack[parent_nodes_remaining],
				output.chaining_value(),
				this.key_words,
				this.flags
			);
		}

		output.root_output_bytes(out);
	}

	private add_chunk_chaining_value(new_cv: Uint32Array, total_chunks: u64): void {
		let mut_new_cv = new_cv;
		let mut_total_chunks = total_chunks;

		while ((mut_total_chunks & 1) == 0) {
			mut_new_cv = parent_cv(this.pop_stack(), mut_new_cv, this.key_words, this.flags);
			mut_total_chunks >>= 1;
		}

		this.push_stack(mut_new_cv);
	}

	private push_stack(cv: Uint32Array): void {
		this.cv_stack[this.cv_stack_len].set(cv);
		this.cv_stack_len++;
	}

	private pop_stack(): Uint32Array {
		this.cv_stack_len--;
		return this.cv_stack[this.cv_stack_len];
	}
}

// SIMD-optimized ChunkState that uses SIMD operations
class ChunkState {
	chaining_value: Uint32Array;
	chunk_counter: u64;
	block: Uint8Array;
	block_len: u8;
	blocks_compressed: u8;
	flags: u32;

	constructor(key_words: Uint32Array, chunk_counter: u64, flags: u32) {
		this.chaining_value = new Uint32Array(8);
		this.chunk_counter = chunk_counter;
		this.block = new Uint8Array(BLOCK_LEN);
		this.block_len = 0;
		this.blocks_compressed = 0;
		this.flags = flags;

		this.chaining_value.set(key_words);
	}

	len(): i32 {
		return BLOCK_LEN * this.blocks_compressed + this.block_len;
	}

	start_flag(): u32 {
		return this.blocks_compressed == 0 ? CHUNK_START : 0;
	}

	update(input: Uint8Array): void {
		let inputPos = 0;
		while (inputPos < input.length) {
			if (this.block_len == BLOCK_LEN) {
				// Use SIMD compress_in_place
				compress_in_place_simd(
					this.chaining_value,
					this.block,
					BLOCK_LEN as u8,
					this.chunk_counter,
					(this.flags | this.start_flag()) as u8
				);
				this.blocks_compressed++;
				this.block = new Uint8Array(BLOCK_LEN);
				this.block_len = 0;
			}

			const want = BLOCK_LEN - this.block_len;
			const take = min(want, input.length - inputPos);
			for (let i = 0; i < take; i++) {
				this.block[this.block_len + i] = input[inputPos + i];
			}
			this.block_len += take as u8;
			inputPos += take;
		}
	}

	output(): Output {
		return {
      input_chaining_value: this.chaining_value,
      block: this.block,
      block_len: this.block_len,
      counter: this.chunk_counter,
      flags: this.flags | this.start_flag() | CHUNK_END
    }
	}
}

// SIMD-optimized Output class
class Output {
	input_chaining_value: Uint32Array;
	block: Uint8Array;
	block_len: u8;
	counter: u64;
	flags: u32;


	chaining_value(): Uint32Array {
		const cv_copy = new Uint32Array(8);
		cv_copy.set(this.input_chaining_value);
		compress_in_place_simd(cv_copy, this.block, this.block_len, this.counter, this.flags as u8);
		return cv_copy;
	}

	root_output_bytes(out: Uint8Array): void {
		let output_block_counter: u64 = 0;
		for (let i = 0; i < out.length; i += 2 * OUT_LEN) {
			const xof_output = compress_xof_simd(
				this.input_chaining_value,
				this.block,
				this.block_len,
				output_block_counter,
				(this.flags | ROOT) as u8
			);
			const out_block = out.subarray(i, i + 2 * OUT_LEN);
			for (let j = 0; j < out_block.length; j++) {
				out_block[j] = xof_output[j];
			}
			output_block_counter++;
		}
	}
}

// Helper functions from blake3.ts
function parent_output(
	left_child_cv: Uint32Array,
	right_child_cv: Uint32Array,
	key_words: Uint32Array,
	flags: u32
): Output {
	const block = new Uint8Array(BLOCK_LEN);
  const dataView = new DataView(block.buffer);

  dataView.setUint32(0, left_child_cv[0], true);
  dataView.setUint32(4, left_child_cv[1], true);
  dataView.setUint32(8, left_child_cv[2], true);
  dataView.setUint32(12, left_child_cv[3], true);
  dataView.setUint32(16, left_child_cv[4], true);
  dataView.setUint32(20, left_child_cv[5], true);
  dataView.setUint32(24, left_child_cv[6], true);
  dataView.setUint32(28, left_child_cv[7], true);

  dataView.setUint32(32, right_child_cv[0], true);
  dataView.setUint32(36, right_child_cv[1], true);
  dataView.setUint32(40, right_child_cv[2], true);
  dataView.setUint32(44, right_child_cv[3], true);
  dataView.setUint32(48, right_child_cv[4], true);
  dataView.setUint32(52, right_child_cv[5], true);
  dataView.setUint32(56, right_child_cv[6], true);
  dataView.setUint32(60, right_child_cv[7], true);

	return {
    input_chaining_value: key_words,
    block: block,
    block_len: BLOCK_LEN as u8,
    counter: 0,
    flags: PARENT | flags
  }
}

function parent_cv(
	left_child_cv: Uint32Array,
	right_child_cv: Uint32Array,
	key_words: Uint32Array,
	flags: u32
): Uint32Array {
	return parent_output(left_child_cv, right_child_cv, key_words, flags).chaining_value();
}

function le_bytes_from_words_32(words: StaticArray<u32>): StaticArray<u8> {
	const bytes = new StaticArray<u8>(32);
	for (let i = 0; i < 8; i++) {
		const word = words[i];
		const offset = i * 4;
		bytes[offset] = word as u8;
		bytes[offset + 1] = (word >> 8) as u8;
		bytes[offset + 2] = (word >> 16) as u8;
		bytes[offset + 3] = (word >> 24) as u8;
	}
	return bytes;
}

// Export SIMD-optimized functions
export function blake3Simd(input: Uint8Array): Uint8Array {
	const hasher = new Blake3SimdHasher();
	hasher.update(input);
	const output = new Uint8Array(32);
	hasher.finalize(output);
	return output;
}

export function blake3SimdHex(input: Uint8Array): string {
	const hash = blake3Simd(input);
	const hex = new Array<string>(64);
	for (let i = 0; i < 32; i++) {
		hex[i * 2] = (hash[i] >> 4).toString(16);
		hex[i * 2 + 1] = (hash[i] & 0x0f).toString(16);
	}
	return hex.join("");
}

export function blake3SimdKeyed(input: Uint8Array, key: Uint8Array): Uint8Array {
	const hasher = Blake3SimdHasher.newKeyed(key);
	hasher.update(input);
	const output = new Uint8Array(32);
	hasher.finalize(output);
	return output;
}

export function blake3SimdKeyedHex(input: Uint8Array, key: Uint8Array): string {
	const hash = blake3SimdKeyed(input, key);
	const hex = new Array<string>(64);
	for (let i = 0; i < 32; i++) {
		hex[i * 2] = (hash[i] >> 4).toString(16);
		hex[i * 2 + 1] = (hash[i] & 0x0f).toString(16);
	}
	return hex.join("");
}

export function createSimdHasher(): Blake3SimdHasher {
	return new Blake3SimdHasher();
}

export function createSimdKeyedHasher(key: Uint8Array): Blake3SimdHasher {
	return Blake3SimdHasher.newKeyed(key);
}

export function updateSimd(hasher: Blake3SimdHasher, input: Uint8Array): void {
	hasher.update(input);
}

export function finalizeSimd(hasher: Blake3SimdHasher): Uint8Array {
	const output = new Uint8Array(32);
	hasher.finalize(output);
	return output;
}

// SIMD hash4 function for parallel processing
export function hash4Simd(
	inputs: StaticArray<Uint8Array>,
	key: Uint8Array,
	counter: u64,
	flags: u8,
	flags_start: u8,
	flags_end: u8
): Uint8Array {
	if (inputs.length != DEGREE) {
		throw new Error("hash4Simd requires exactly 4 inputs");
	}
	
	const key_words = new Uint32Array(8);
	const dataView = new DataView(key.buffer);
	for (let i = 0; i < 8; i++) {
		key_words[i] = dataView.getUint32(i * 4, true);
	}
	
	const blocks = inputs[0].length / BLOCK_LEN;
	const out = new Uint8Array(DEGREE * OUT_LEN);
	
	hash4_simd(inputs, blocks, key_words, counter, flags, flags_start, flags_end, out);
	
  return out;
}