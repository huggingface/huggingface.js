/**
 * BLAKE3 WASM SIMD - Runtime bytecode generation
 *
 * Generates WebAssembly SIMD bytecode at runtime to process 4 compress
 * operations in parallel using 128-bit SIMD vectors (i32x4).
 *
 * Key insight: One i32x4.add instruction performs 4 parallel additions,
 * giving us 4x throughput for the same number of instructions.
 *
 * Memory layout (all values are transposed for SIMD access):
 *   0-511:    4 x 16 message words (m0_0,m0_1,m0_2,m0_3, m1_0,m1_1,m1_2,m1_3, ...)
 *   512-639:  4 x 8 chaining values
 *   640-767:  4 x 8 output values
 *   768-783:  4 x counter low
 *   784-799:  4 x counter high
 *   800-815:  4 x block length
 *   816-831:  4 x flags
 */

// LEB128 encoding with minimum 2 bytes
// This fixes a V8 quirk where single-byte values 64-127 cause issues
// when followed by certain SIMD instructions
function toLebU32Min2(n: number): number[] {
  // Always use at least 2 bytes
  return [(n & 0x7f) | 0x80, (n >>> 7) & 0x7f];
}

// LEB128 encoding padded to exactly 5 bytes (for backpatching)
// Uses continuation bits for all but the last byte
function toLebU32Padded5(n: number): number[] {
  return [
    (n & 0x7f) | 0x80,
    ((n >>> 7) & 0x7f) | 0x80,
    ((n >>> 14) & 0x7f) | 0x80,
    ((n >>> 21) & 0x7f) | 0x80,
    (n >>> 28) & 0x0f, // Last byte has no continuation bit
  ];
}

// Signed LEB128 encoding for i32 constants (handles full 32-bit range)
// WASM i32.const uses signed LEB128 immediate
function toSignedLeb128_i32(n: number): number[] {
  const bytes: number[] = [];
  // Treat as signed 32-bit integer
  let value = n | 0;
  let more = true;
  while (more) {
    let byte = value & 0x7f;
    // Arithmetic right shift preserves sign
    value >>= 7;
    // Check if we're done:
    // - If value is 0 and sign bit of byte is clear, we're done
    // - If value is -1 and sign bit of byte is set, we're done
    if ((value === 0 && (byte & 0x40) === 0) || (value === -1 && (byte & 0x40) !== 0)) {
      more = false;
    } else {
      byte |= 0x80;
    }
    bytes.push(byte);
  }
  return bytes;
}

// Precomputed message access order for all 7 rounds
const MSG_ACCESS_ORDER = [
  // Round 1: 0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15
  0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15,
  // Round 2: 2,6,3,10,7,0,4,13,1,11,12,5,9,14,15,8
  2, 6, 3, 10, 7, 0, 4, 13, 1, 11, 12, 5, 9, 14, 15, 8,
  // Round 3: 3,4,10,12,13,2,7,14,6,5,9,0,11,15,8,1
  3, 4, 10, 12, 13, 2, 7, 14, 6, 5, 9, 0, 11, 15, 8, 1,
  // Round 4: 10,7,12,9,14,3,13,15,4,0,11,2,5,8,1,6
  10, 7, 12, 9, 14, 3, 13, 15, 4, 0, 11, 2, 5, 8, 1, 6,
  // Round 5: 12,13,9,11,15,10,14,8,7,2,5,3,0,1,6,4
  12, 13, 9, 11, 15, 10, 14, 8, 7, 2, 5, 3, 0, 1, 6, 4,
  // Round 6: 9,14,11,5,8,12,15,1,13,3,0,10,2,6,4,7
  9, 14, 11, 5, 8, 12, 15, 1, 13, 3, 0, 10, 2, 6, 4, 7,
  // Round 7: 11,15,5,0,1,9,8,6,14,10,2,12,3,4,7,13
  11, 15, 5, 0, 1, 9, 8, 6, 14, 10, 2, 12, 3, 4, 7, 13,
];

// BLAKE3 Constants (used in generated WASM code)
// CHUNK_START = 1, CHUNK_END = 2 are embedded directly in WASM bytecode

/**
 * Generate the WASM module bytecode with compress4x, compressChunks4x, and compressParent functions.
 */
function generateWasmBytes(): Uint8Array {
  const code: number[] = [];

  // Helper to append bytes
  function put(bytes: number[]): void {
    code.push(...bytes);
  }

  // WASM module header
  put([0x00, 0x61, 0x73, 0x6d]); // Magic
  put([0x01, 0x00, 0x00, 0x00]); // Version

  // Section 1: Types
  put([0x01]); // Section ID
  put([0x04]); // Section size
  put([0x01]); // 1 type
  put([0x60, 0x00, 0x00]); // func () -> ()

  // Section 2: Imports (memory from JS)
  put([0x02]); // Section ID
  put([0x0b]); // Section size
  put([0x01]); // 1 import
  put([0x02, 0x6a, 0x73]); // "js"
  put([0x03, 0x6d, 0x65, 0x6d]); // "mem"
  put([0x02, 0x00, 0x01]); // memory min=1, no max

  // Section 3: Functions
  put([0x03]); // Section ID
  put([0x04]); // Section size (3 functions = 4 bytes)
  put([0x03]); // 3 functions
  put([0x00]); // Function 0: type index 0
  put([0x00]); // Function 1: type index 0
  put([0x00]); // Function 2: type index 0

  // Section 7: Exports
  // Size calculation: 1 (count) + (1+10+1+1) + (1+16+1+1) + (1+14+1+1) = 1 + 13 + 19 + 17 = 50 bytes
  put([0x07]); // Section ID
  put([0x32]); // Section size (50 bytes)
  put([0x03]); // 3 exports
  // "compress4x" -> func 0
  put([0x0a]); // name length
  put([0x63, 0x6f, 0x6d, 0x70, 0x72, 0x65, 0x73, 0x73, 0x34, 0x78]); // "compress4x"
  put([0x00, 0x00]); // func index 0
  // "compressChunks4x" -> func 1
  put([0x10]); // name length (16)
  put([
    0x63, 0x6f, 0x6d, 0x70, 0x72, 0x65, 0x73, 0x73, 0x43, 0x68, 0x75, 0x6e, 0x6b, 0x73, 0x34, 0x78,
  ]); // "compressChunks4x"
  put([0x00, 0x01]); // func index 1
  // "compressParent" -> func 2
  put([0x0e]); // name length (14)
  put([0x63, 0x6f, 0x6d, 0x70, 0x72, 0x65, 0x73, 0x73, 0x50, 0x61, 0x72, 0x65, 0x6e, 0x74]); // "compressParent"
  put([0x00, 0x02]); // func index 2

  // Section 10: Code
  put([0x0a]); // Section ID
  // Reserve 5 bytes for section size (LEB128 u32)
  const sectionSizeOffset = code.length;
  put([0x00, 0x00, 0x00, 0x00, 0x00]);

  put([0x03]); // 3 functions

  // === Function 0: compress4x ===
  // Reserve 5 bytes for function size
  const funcSizeOffset = code.length;
  put([0x00, 0x00, 0x00, 0x00, 0x00]);

  const funcBodyStart = code.length;

  // Local declarations: 32 v128 locals
  // Variables $0-$15: message words (m0-m15)
  // Variables $16-$31: state words (s0-s15)
  put([0x01]); // 1 local declaration
  put([0x20, 0x7b]); // 32 x v128

  // ===== Function body =====

  // Load message words from memory (offset 0-255)
  // Each v128 is 16 bytes, so m[i] is at offset i*16
  // Note: we use toLebU32Min2 to avoid V8 quirk with single-byte values 64-127
  for (let i = 0; i < 16; i++) {
    put([0x41, ...toLebU32Min2(i * 16)]); // i32.const offset (2+ byte LEB128)
    put([0xfd, 0x00, 0x02, 0x00]); // v128.load align=4 offset=0
    put([0x21, i]); // local.set $i
  }

  // Load chaining values (offset 512-639)
  // cv[i] at offset 512 + i*16
  for (let i = 0; i < 8; i++) {
    put([0x41, ...toLebU32Min2(512 + i * 16)]); // i32.const offset
    put([0xfd, 0x00, 0x02, 0x00]); // v128.load
    put([0x21, 16 + i]); // local.set $(16+i)
  }

  // Initialize state[8-15] from IV and parameters
  // s8-s11 = IV[0-3]
  const IV = [0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a];
  for (let i = 0; i < 4; i++) {
    // Create v128 constant with all lanes set to IV[i]
    const ivBytes = [];
    for (let j = 0; j < 4; j++) {
      ivBytes.push(IV[i] & 0xff);
      ivBytes.push((IV[i] >>> 8) & 0xff);
      ivBytes.push((IV[i] >>> 16) & 0xff);
      ivBytes.push((IV[i] >>> 24) & 0xff);
    }
    put([0xfd, 0x0c, ...ivBytes]); // v128.const
    put([0x21, 24 + i]); // local.set $(24+i) -> s8-s11
  }

  // s12 = counter_low (offset 768)
  put([0x41, ...toLebU32Min2(768)]); // i32.const
  put([0xfd, 0x00, 0x02, 0x00]); // v128.load
  put([0x21, 28]); // local.set $28 -> s12

  // s13 = counter_high (offset 784)
  put([0x41, ...toLebU32Min2(784)]); // i32.const
  put([0xfd, 0x00, 0x02, 0x00]); // v128.load
  put([0x21, 29]); // local.set $29 -> s13

  // s14 = block_len (offset 800)
  put([0x41, ...toLebU32Min2(800)]); // i32.const
  put([0xfd, 0x00, 0x02, 0x00]); // v128.load
  put([0x21, 30]); // local.set $30 -> s14

  // s15 = flags (offset 816)
  put([0x41, ...toLebU32Min2(816)]); // i32.const
  put([0xfd, 0x00, 0x02, 0x00]); // v128.load
  put([0x21, 31]); // local.set $31 -> s15

  // ===== 7 rounds of mixing =====

  let msgIdx = 0; // Index into MSG_ACCESS_ORDER

  // Helper to generate G function (inlined)
  // G(a, b, c, d) with two message words
  function g(a: number, b: number, c: number, d: number): void {
    const mx = MSG_ACCESS_ORDER[msgIdx++];
    const my = MSG_ACCESS_ORDER[msgIdx++];

    // Variables: a,b,c,d are state indices (16-31), mx,my are message indices (0-15)

    // First half of G
    // s[a] = s[a] + s[b] + m[mx]
    put([0x20, 16 + a]); // local.get s[a]
    put([0x20, 16 + b]); // local.get s[b]
    put([0xfd, 0xae, 0x01]); // i32x4.add
    put([0x20, mx]); // local.get m[mx]
    put([0xfd, 0xae, 0x01]); // i32x4.add
    put([0x21, 16 + a]); // local.set s[a]

    // s[d] = rotr(s[d] ^ s[a], 16) - using i8x16.shuffle (single instruction vs shift+or)
    // ROTR16 pattern: [2,3,0,1, 6,7,4,5, 10,11,8,9, 14,15,12,13]
    put([0x20, 16 + d]); // local.get s[d]
    put([0x20, 16 + a]); // local.get s[a]
    put([0xfd, 0x51]); // v128.xor
    put([0x22, 16 + d]); // local.tee s[d]
    put([0x20, 16 + d]); // local.get s[d] (second operand for shuffle)
    put([0xfd, 0x0d, 2, 3, 0, 1, 6, 7, 4, 5, 10, 11, 8, 9, 14, 15, 12, 13]); // i8x16.shuffle ROTR16
    put([0x21, 16 + d]); // local.set s[d]

    // s[c] = s[c] + s[d]
    put([0x20, 16 + c]); // local.get s[c]
    put([0x20, 16 + d]); // local.get s[d]
    put([0xfd, 0xae, 0x01]); // i32x4.add
    put([0x21, 16 + c]); // local.set s[c]

    // s[b] = (s[b] ^ s[c]) >>> 12
    put([0x20, 16 + b]); // local.get s[b]
    put([0x20, 16 + c]); // local.get s[c]
    put([0xfd, 0x51]); // v128.xor
    put([0x22, 16 + b]); // local.tee s[b]
    put([0x41, 0x0c]); // i32.const 12
    put([0xfd, 0xad, 0x01]); // i32x4.shr_u (opcode 173 = 0xAD)
    put([0x20, 16 + b]); // local.get s[b]
    put([0x41, 0x14]); // i32.const 20
    put([0xfd, 0xab, 0x01]); // i32x4.shl
    put([0xfd, 0x50]); // v128.or
    put([0x21, 16 + b]); // local.set s[b]

    // Second half of G
    // s[a] = s[a] + s[b] + m[my]
    put([0x20, 16 + a]); // local.get s[a]
    put([0x20, 16 + b]); // local.get s[b]
    put([0xfd, 0xae, 0x01]); // i32x4.add
    put([0x20, my]); // local.get m[my]
    put([0xfd, 0xae, 0x01]); // i32x4.add
    put([0x21, 16 + a]); // local.set s[a]

    // s[d] = rotr(s[d] ^ s[a], 8) - using i8x16.shuffle (single instruction vs shift+or)
    // ROTR8 pattern: [1,2,3,0, 5,6,7,4, 9,10,11,8, 13,14,15,12]
    put([0x20, 16 + d]); // local.get s[d]
    put([0x20, 16 + a]); // local.get s[a]
    put([0xfd, 0x51]); // v128.xor
    put([0x22, 16 + d]); // local.tee s[d]
    put([0x20, 16 + d]); // local.get s[d] (second operand for shuffle)
    put([0xfd, 0x0d, 1, 2, 3, 0, 5, 6, 7, 4, 9, 10, 11, 8, 13, 14, 15, 12]); // i8x16.shuffle ROTR8
    put([0x21, 16 + d]); // local.set s[d]

    // s[c] = s[c] + s[d]
    put([0x20, 16 + c]); // local.get s[c]
    put([0x20, 16 + d]); // local.get s[d]
    put([0xfd, 0xae, 0x01]); // i32x4.add
    put([0x21, 16 + c]); // local.set s[c]

    // s[b] = (s[b] ^ s[c]) >>> 7
    put([0x20, 16 + b]); // local.get s[b]
    put([0x20, 16 + c]); // local.get s[c]
    put([0xfd, 0x51]); // v128.xor
    put([0x22, 16 + b]); // local.tee s[b]
    put([0x41, 0x07]); // i32.const 7
    put([0xfd, 0xad, 0x01]); // i32x4.shr_u (opcode 173 = 0xAD)
    put([0x20, 16 + b]); // local.get s[b]
    put([0x41, 0x19]); // i32.const 25
    put([0xfd, 0xab, 0x01]); // i32x4.shl
    put([0xfd, 0x50]); // v128.or
    put([0x21, 16 + b]); // local.set s[b]
  }

  // Generate all 7 rounds
  for (let round = 0; round < 7; round++) {
    // Column mixing
    g(0, 4, 8, 12);
    g(1, 5, 9, 13);
    g(2, 6, 10, 14);
    g(3, 7, 11, 15);

    // Diagonal mixing
    g(0, 5, 10, 15);
    g(1, 6, 11, 12);
    g(2, 7, 8, 13);
    g(3, 4, 9, 14);
  }

  // ===== Final XOR and store output =====

  // out[i] = s[i] ^ s[i+8] for i in 0..7
  // Store at offset 640-767
  for (let i = 0; i < 8; i++) {
    put([0x41, ...toLebU32Min2(640 + i * 16)]); // i32.const offset
    put([0x20, 16 + i]); // local.get s[i]
    put([0x20, 24 + i]); // local.get s[i+8]
    put([0xfd, 0x51]); // v128.xor
    put([0xfd, 0x0b, 0x02, 0x00]); // v128.store align=4
  }

  // End of function
  put([0x0b]); // end

  // Fill in function 0 size using padded LEB128
  const funcBodySize = code.length - funcBodyStart;
  const funcSizeBytes = toLebU32Padded5(funcBodySize);
  for (let i = 0; i < 5; i++) {
    code[funcSizeOffset + i] = funcSizeBytes[i];
  }

  // === Function 1: compressChunks4x ===
  // Reserve 5 bytes for function size
  const func1SizeOffset = code.length;
  put([0x00, 0x00, 0x00, 0x00, 0x00]);

  const func1BodyStart = code.length;

  // Generate the compressChunks4x function body
  const compressChunksBody = generateCompressChunks4xBody();
  put(compressChunksBody);

  // Fill in function 1 size using padded LEB128
  const func1BodySize = code.length - func1BodyStart;
  const func1SizeBytes = toLebU32Padded5(func1BodySize);
  for (let i = 0; i < 5; i++) {
    code[func1SizeOffset + i] = func1SizeBytes[i];
  }

  // === Function 2: compressParent ===
  // Reserve 5 bytes for function size
  const func2SizeOffset = code.length;
  put([0x00, 0x00, 0x00, 0x00, 0x00]);

  const func2BodyStart = code.length;

  // Generate the compressParent function body
  const compressParentBody = generateCompressParentBody();
  put(compressParentBody);

  // Fill in function 2 size using padded LEB128
  const func2BodySize = code.length - func2BodyStart;
  const func2SizeBytes = toLebU32Padded5(func2BodySize);
  for (let i = 0; i < 5; i++) {
    code[func2SizeOffset + i] = func2SizeBytes[i];
  }

  // Fill in section size using padded LEB128
  const sectionSize = code.length - sectionSizeOffset - 5;
  const sectionSizeBytes = toLebU32Padded5(sectionSize);
  for (let i = 0; i < 5; i++) {
    code[sectionSizeOffset + i] = sectionSizeBytes[i];
  }

  return new Uint8Array(code);
}

/**
 * Generate compressChunks4x WASM function body.
 * Processes all 16 blocks of 4 chunks in a single call.
 */
function generateCompressChunks4xBody(): number[] {
  const code: number[] = [];

  function put(bytes: number[]): void {
    code.push(...bytes);
  }

  // Local declarations: 32 v128 locals + 1 i32 for position
  // Locals $0-$15: message words (reloaded each iteration)
  // Locals $16-$31: state words (s0-s15)
  // Local $32: position counter (i32)
  put([0x02]); // 2 local declarations
  put([0x20, 0x7b]); // 32 x v128
  put([0x01, 0x7f]); // 1 x i32

  const BATCH_BLOCK_WORDS = SIMD_MEMORY.BATCH_BLOCK_WORDS;
  const BATCH_CV = SIMD_MEMORY.BATCH_CV;
  const BATCH_COUNTER_LOW = SIMD_MEMORY.BATCH_COUNTER_LOW;
  const BATCH_FLAGS_BASE = SIMD_MEMORY.BATCH_FLAGS_BASE;
  const BATCH_OUTPUT = SIMD_MEMORY.BATCH_OUTPUT;

  // IV constants (same as compress4x)
  const IV = [0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a];

  // Load initial CVs from BATCH_CV into locals $16-$23
  for (let i = 0; i < 8; i++) {
    put([0x41, ...toLebU32Min2(BATCH_CV + i * 16)]); // i32.const offset
    put([0xfd, 0x00, 0x02, 0x00]); // v128.load align=4 offset=0
    put([0x21, 16 + i]); // local.set $(16+i) -> s0-s7
  }

  // Initialize $32 (pos) = 0
  put([0x41, 0x00]); // i32.const 0
  put([0x21, 0x20]); // local.set $32

  // block $done
  put([0x02, 0x40]); // block void

  // loop $continue
  put([0x03, 0x40]); // loop void

  // === Load message words for position $pos ===
  // offset = BATCH_BLOCK_WORDS + pos * 256 + word * 16
  for (let w = 0; w < 16; w++) {
    put([0x20, 0x20]); // local.get $32 (pos)
    put([0x41, ...toLebU32Min2(256)]); // i32.const 256
    put([0x6c]); // i32.mul
    put([0x41, ...toLebU32Min2(BATCH_BLOCK_WORDS + w * 16)]); // i32.const base + word*16
    put([0x6a]); // i32.add
    put([0xfd, 0x00, 0x02, 0x00]); // v128.load align=4 offset=0
    put([0x21, w]); // local.set $w
  }

  // === Initialize state[8-15] ===
  // s8-s11 = IV[0-3]
  for (let i = 0; i < 4; i++) {
    const ivBytes = [];
    for (let j = 0; j < 4; j++) {
      ivBytes.push(IV[i] & 0xff);
      ivBytes.push((IV[i] >>> 8) & 0xff);
      ivBytes.push((IV[i] >>> 16) & 0xff);
      ivBytes.push((IV[i] >>> 24) & 0xff);
    }
    put([0xfd, 0x0c, ...ivBytes]); // v128.const
    put([0x21, 24 + i]); // local.set $(24+i) -> s8-s11
  }

  // s12 = counter_low (from BATCH_COUNTER_LOW)
  put([0x41, ...toLebU32Min2(BATCH_COUNTER_LOW)]); // i32.const
  put([0xfd, 0x00, 0x02, 0x00]); // v128.load
  put([0x21, 28]); // local.set $28 -> s12

  // s13 = 0 (counter high - assume fits in 32 bits)
  put([0xfd, 0x0c, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]); // v128.const 0
  put([0x21, 29]); // local.set $29 -> s13

  // s14 = 64 (block_len = 64 for full blocks)
  const blockLen64 = [];
  for (let j = 0; j < 4; j++) {
    blockLen64.push(64, 0, 0, 0); // 64 in little-endian
  }
  put([0xfd, 0x0c, ...blockLen64]); // v128.const [64,64,64,64]
  put([0x21, 30]); // local.set $30 -> s14

  // s15 = flags = base_flags | (pos == 0 ? 1 : 0) | (pos == 15 ? 2 : 0)
  // First load base flags
  put([0x41, ...toLebU32Min2(BATCH_FLAGS_BASE)]); // i32.const
  put([0xfd, 0x00, 0x02, 0x00]); // v128.load base flags

  // Compute position-dependent bits
  // CHUNK_START (1) if pos == 0
  put([0x20, 0x20]); // local.get $32 (pos)
  put([0x45]); // i32.eqz -> 1 if pos==0, 0 otherwise
  // CHUNK_END (2) if pos == 15
  put([0x20, 0x20]); // local.get $32 (pos)
  put([0x41, 0x0f]); // i32.const 15
  put([0x46]); // i32.eq -> 1 if pos==15, 0 otherwise
  put([0x41, 0x01]); // i32.const 1 (shift amount)
  put([0x74]); // i32.shl -> 2 if pos==15, 0 otherwise
  // OR the two bits together
  put([0x72]); // i32.or -> combined position bits
  // Splat to v128 and OR with base flags (stack: base_flags, bits)
  put([0xfd, 0x11]); // i32x4.splat
  put([0xfd, 0x50]); // v128.or
  put([0x21, 31]); // local.set $31 -> s15

  // === 7 rounds of mixing ===
  let msgIdx = 0;

  function g(a: number, b: number, c: number, d: number): void {
    const mx = MSG_ACCESS_ORDER[msgIdx++];
    const my = MSG_ACCESS_ORDER[msgIdx++];

    // First half of G: s[a] = s[a] + s[b] + m[mx]
    put([0x20, 16 + a]); // local.get s[a]
    put([0x20, 16 + b]); // local.get s[b]
    put([0xfd, 0xae, 0x01]); // i32x4.add
    put([0x20, mx]); // local.get m[mx]
    put([0xfd, 0xae, 0x01]); // i32x4.add
    put([0x21, 16 + a]); // local.set s[a]

    // s[d] = rotr(s[d] ^ s[a], 16) - byte shuffle
    put([0x20, 16 + d]); // local.get s[d]
    put([0x20, 16 + a]); // local.get s[a]
    put([0xfd, 0x51]); // v128.xor
    put([0x22, 16 + d]); // local.tee s[d]
    put([0x20, 16 + d]); // local.get s[d]
    put([0xfd, 0x0d, 2, 3, 0, 1, 6, 7, 4, 5, 10, 11, 8, 9, 14, 15, 12, 13]); // i8x16.shuffle ROTR16
    put([0x21, 16 + d]); // local.set s[d]

    // s[c] = s[c] + s[d]
    put([0x20, 16 + c]); // local.get s[c]
    put([0x20, 16 + d]); // local.get s[d]
    put([0xfd, 0xae, 0x01]); // i32x4.add
    put([0x21, 16 + c]); // local.set s[c]

    // s[b] = rotr(s[b] ^ s[c], 12)
    put([0x20, 16 + b]); // local.get s[b]
    put([0x20, 16 + c]); // local.get s[c]
    put([0xfd, 0x51]); // v128.xor
    put([0x22, 16 + b]); // local.tee s[b]
    put([0x41, 0x0c]); // i32.const 12
    put([0xfd, 0xad, 0x01]); // i32x4.shr_u (opcode 173 = 0xAD)
    put([0x20, 16 + b]); // local.get s[b]
    put([0x41, 0x14]); // i32.const 20
    put([0xfd, 0xab, 0x01]); // i32x4.shl
    put([0xfd, 0x50]); // v128.or
    put([0x21, 16 + b]); // local.set s[b]

    // Second half: s[a] = s[a] + s[b] + m[my]
    put([0x20, 16 + a]); // local.get s[a]
    put([0x20, 16 + b]); // local.get s[b]
    put([0xfd, 0xae, 0x01]); // i32x4.add
    put([0x20, my]); // local.get m[my]
    put([0xfd, 0xae, 0x01]); // i32x4.add
    put([0x21, 16 + a]); // local.set s[a]

    // s[d] = rotr(s[d] ^ s[a], 8) - byte shuffle
    put([0x20, 16 + d]); // local.get s[d]
    put([0x20, 16 + a]); // local.get s[a]
    put([0xfd, 0x51]); // v128.xor
    put([0x22, 16 + d]); // local.tee s[d]
    put([0x20, 16 + d]); // local.get s[d]
    put([0xfd, 0x0d, 1, 2, 3, 0, 5, 6, 7, 4, 9, 10, 11, 8, 13, 14, 15, 12]); // i8x16.shuffle ROTR8
    put([0x21, 16 + d]); // local.set s[d]

    // s[c] = s[c] + s[d]
    put([0x20, 16 + c]); // local.get s[c]
    put([0x20, 16 + d]); // local.get s[d]
    put([0xfd, 0xae, 0x01]); // i32x4.add
    put([0x21, 16 + c]); // local.set s[c]

    // s[b] = rotr(s[b] ^ s[c], 7)
    put([0x20, 16 + b]); // local.get s[b]
    put([0x20, 16 + c]); // local.get s[c]
    put([0xfd, 0x51]); // v128.xor
    put([0x22, 16 + b]); // local.tee s[b]
    put([0x41, 0x07]); // i32.const 7
    put([0xfd, 0xad, 0x01]); // i32x4.shr_u (opcode 173 = 0xAD)
    put([0x20, 16 + b]); // local.get s[b]
    put([0x41, 0x19]); // i32.const 25
    put([0xfd, 0xab, 0x01]); // i32x4.shl
    put([0xfd, 0x50]); // v128.or
    put([0x21, 16 + b]); // local.set s[b]
  }

  // Generate all 7 rounds
  for (let round = 0; round < 7; round++) {
    // Column mixing
    g(0, 4, 8, 12);
    g(1, 5, 9, 13);
    g(2, 6, 10, 14);
    g(3, 7, 11, 15);
    // Diagonal mixing
    g(0, 5, 10, 15);
    g(1, 6, 11, 12);
    g(2, 7, 8, 13);
    g(3, 4, 9, 14);
  }

  // === Update CVs: cv[i] = s[i] ^ s[i+8] ===
  // Store back to state locals $16-$23 (the CV positions)
  for (let i = 0; i < 8; i++) {
    put([0x20, 16 + i]); // local.get s[i]
    put([0x20, 24 + i]); // local.get s[i+8]
    put([0xfd, 0x51]); // v128.xor
    put([0x21, 16 + i]); // local.set $(16+i) - update CV
  }

  // === Loop control: pos++, continue if pos < 16 ===
  put([0x20, 0x20]); // local.get $32 (pos)
  put([0x41, 0x01]); // i32.const 1
  put([0x6a]); // i32.add
  put([0x22, 0x20]); // local.tee $32 (pos)
  put([0x41, 0x10]); // i32.const 16
  put([0x49]); // i32.lt_u
  put([0x0d, 0x00]); // br_if 0 (continue loop)

  // end loop
  put([0x0b]); // end

  // end block
  put([0x0b]); // end

  // === Store final CVs to BATCH_OUTPUT ===
  for (let i = 0; i < 8; i++) {
    put([0x41, ...toLebU32Min2(BATCH_OUTPUT + i * 16)]); // i32.const offset
    put([0x20, 16 + i]); // local.get $(16+i) - CV word
    put([0xfd, 0x0b, 0x02, 0x00]); // v128.store align=4
  }

  // end function
  put([0x0b]); // end

  return code;
}

/**
 * Generate compressParent WASM function body.
 * Performs a single parent node compression using scalar i32 operations.
 * Reads 16 words from PARENT_BLOCK, writes 8 words to CHUNK_CV.
 * Uses IV, counter=0, blockLen=64, flags=PARENT(4).
 */
function generateCompressParentBody(): number[] {
  const code: number[] = [];

  function put(bytes: number[]): void {
    code.push(...bytes);
  }

  // Local declarations: 32 i32 locals for state (s0-s15) and message (m0-m15)
  put([0x01]); // 1 local declaration
  put([0x20, 0x7f]); // 32 x i32

  // Message word indices: 0-15, State indices: 16-31
  // Locals $0-$15: message words (m0-m15)
  // Locals $16-$31: state words (s0-s15)

  const PARENT_BLOCK_OFFSET = SIMD_MEMORY.PARENT_BLOCK;
  const CHUNK_CV_OFFSET = SIMD_MEMORY.CHUNK_CV;

  // BLAKE3 IV
  const IV = [
    0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19,
  ];

  // Load message words from PARENT_BLOCK (16 words at offset 7264)
  for (let i = 0; i < 16; i++) {
    put([0x41, ...toLebU32Min2(PARENT_BLOCK_OFFSET + i * 4)]); // i32.const offset
    put([0x28, 0x02, 0x00]); // i32.load align=4 offset=0
    put([0x21, i]); // local.set $i (m0-m15)
  }

  // Initialize state s0-s7 = IV[0-7]
  for (let i = 0; i < 8; i++) {
    put([0x41, ...toSignedLeb128_i32(IV[i])]); // i32.const IV[i]
    put([0x21, 16 + i]); // local.set $(16+i) -> s0-s7
  }

  // Initialize state s8-s11 = IV[0-3]
  for (let i = 0; i < 4; i++) {
    put([0x41, ...toSignedLeb128_i32(IV[i])]); // i32.const IV[i]
    put([0x21, 24 + i]); // local.set $(24+i) -> s8-s11
  }

  // s12 = counter_low = 0
  put([0x41, 0x00]); // i32.const 0
  put([0x21, 28]); // local.set $28 -> s12

  // s13 = counter_high = 0
  put([0x41, 0x00]); // i32.const 0
  put([0x21, 29]); // local.set $29 -> s13

  // s14 = block_len = 64
  // Note: 0x40 alone is -64 in signed LEB128 (bit 6 is sign bit)
  // For 64, we need [0xC0, 0x00] to avoid sign extension
  put([0x41, 0xc0, 0x00]); // i32.const 64
  put([0x21, 30]); // local.set $30 -> s14

  // s15 = flags = PARENT = 4
  put([0x41, 0x04]); // i32.const 4
  put([0x21, 31]); // local.set $31 -> s15

  // Helper to generate scalar G function (inlined)
  // G(a, b, c, d, mx, my) where a,b,c,d are state indices 0-15, mx,my are message indices 0-15
  function g(a: number, b: number, c: number, d: number, mx: number, my: number): void {
    const sa = 16 + a,
      sb = 16 + b,
      sc = 16 + c,
      sd = 16 + d;

    // s[a] = (s[a] + s[b] + m[mx]) >>> 0
    put([0x20, sa]); // local.get s[a]
    put([0x20, sb]); // local.get s[b]
    put([0x6a]); // i32.add
    put([0x20, mx]); // local.get m[mx]
    put([0x6a]); // i32.add
    put([0x21, sa]); // local.set s[a]

    // s[d] = rotr(s[d] ^ s[a], 16)
    put([0x20, sd]); // local.get s[d]
    put([0x20, sa]); // local.get s[a]
    put([0x73]); // i32.xor
    put([0x41, 0x10]); // i32.const 16
    put([0x78]); // i32.rotr
    put([0x21, sd]); // local.set s[d]

    // s[c] = (s[c] + s[d]) >>> 0
    put([0x20, sc]); // local.get s[c]
    put([0x20, sd]); // local.get s[d]
    put([0x6a]); // i32.add
    put([0x21, sc]); // local.set s[c]

    // s[b] = rotr(s[b] ^ s[c], 12)
    put([0x20, sb]); // local.get s[b]
    put([0x20, sc]); // local.get s[c]
    put([0x73]); // i32.xor
    put([0x41, 0x0c]); // i32.const 12
    put([0x78]); // i32.rotr
    put([0x21, sb]); // local.set s[b]

    // s[a] = (s[a] + s[b] + m[my]) >>> 0
    put([0x20, sa]); // local.get s[a]
    put([0x20, sb]); // local.get s[b]
    put([0x6a]); // i32.add
    put([0x20, my]); // local.get m[my]
    put([0x6a]); // i32.add
    put([0x21, sa]); // local.set s[a]

    // s[d] = rotr(s[d] ^ s[a], 8)
    put([0x20, sd]); // local.get s[d]
    put([0x20, sa]); // local.get s[a]
    put([0x73]); // i32.xor
    put([0x41, 0x08]); // i32.const 8
    put([0x78]); // i32.rotr
    put([0x21, sd]); // local.set s[d]

    // s[c] = (s[c] + s[d]) >>> 0
    put([0x20, sc]); // local.get s[c]
    put([0x20, sd]); // local.get s[d]
    put([0x6a]); // i32.add
    put([0x21, sc]); // local.set s[c]

    // s[b] = rotr(s[b] ^ s[c], 7)
    put([0x20, sb]); // local.get s[b]
    put([0x20, sc]); // local.get s[c]
    put([0x73]); // i32.xor
    put([0x41, 0x07]); // i32.const 7
    put([0x78]); // i32.rotr
    put([0x21, sb]); // local.set s[b]
  }

  // 7 rounds of mixing with permuted message schedule
  let msgIdx = 0;
  for (let round = 0; round < 7; round++) {
    // Column mixing
    g(0, 4, 8, 12, MSG_ACCESS_ORDER[msgIdx], MSG_ACCESS_ORDER[msgIdx + 1]);
    msgIdx += 2;
    g(1, 5, 9, 13, MSG_ACCESS_ORDER[msgIdx], MSG_ACCESS_ORDER[msgIdx + 1]);
    msgIdx += 2;
    g(2, 6, 10, 14, MSG_ACCESS_ORDER[msgIdx], MSG_ACCESS_ORDER[msgIdx + 1]);
    msgIdx += 2;
    g(3, 7, 11, 15, MSG_ACCESS_ORDER[msgIdx], MSG_ACCESS_ORDER[msgIdx + 1]);
    msgIdx += 2;

    // Diagonal mixing
    g(0, 5, 10, 15, MSG_ACCESS_ORDER[msgIdx], MSG_ACCESS_ORDER[msgIdx + 1]);
    msgIdx += 2;
    g(1, 6, 11, 12, MSG_ACCESS_ORDER[msgIdx], MSG_ACCESS_ORDER[msgIdx + 1]);
    msgIdx += 2;
    g(2, 7, 8, 13, MSG_ACCESS_ORDER[msgIdx], MSG_ACCESS_ORDER[msgIdx + 1]);
    msgIdx += 2;
    g(3, 4, 9, 14, MSG_ACCESS_ORDER[msgIdx], MSG_ACCESS_ORDER[msgIdx + 1]);
    msgIdx += 2;
  }

  // Store output: out[i] = s[i] ^ s[i+8] for i in 0..7
  for (let i = 0; i < 8; i++) {
    put([0x41, ...toLebU32Min2(CHUNK_CV_OFFSET + i * 4)]); // i32.const offset
    put([0x20, 16 + i]); // local.get s[i]
    put([0x20, 24 + i]); // local.get s[i+8]
    put([0x73]); // i32.xor
    put([0x36, 0x02, 0x00]); // i32.store align=4 offset=0
  }

  // end function
  put([0x0b]); // end

  return code;
}

// Cached WASM instance
let wasmInstance: WebAssembly.Instance | null = null;
let wasmMemory: WebAssembly.Memory | null = null;
let wasmCompress4x: (() => void) | null = null;
let wasmCompressChunks4x: (() => void) | null = null;
let wasmCompressParent: (() => void) | null = null;
let wasmMemoryView: Uint8Array | null = null;
let wasmMemoryView32: Uint32Array | null = null;

/**
 * Check if WASM SIMD is supported.
 */
export function isSimdSupported(): boolean {
  try {
    // Minimal WASM module with v128.const instruction to test SIMD support
    const simdTest = new Uint8Array([
      0x00,
      0x61,
      0x73,
      0x6d, // magic: \0asm
      0x01,
      0x00,
      0x00,
      0x00, // version: 1

      // Type section (id=1): () -> v128
      0x01, // section id = 1 (type)
      0x05, // section length = 5
      0x01, // 1 type
      0x60,
      0x00,
      0x01,
      0x7b, // func () -> v128

      // Function section (id=3)
      0x03, // section id = 3 (function)
      0x02, // section length = 2
      0x01, // 1 function
      0x00, // type index 0

      // Code section (id=10) with v128.const
      0x0a, // section id = 10 (code)
      0x16, // section length = 22
      0x01, // 1 function body
      0x14, // body length = 20
      0x00, // 0 locals
      0xfd,
      0x0c, // v128.const opcode
      0x00,
      0x00,
      0x00,
      0x00,
      0x00,
      0x00,
      0x00,
      0x00,
      0x00,
      0x00,
      0x00,
      0x00,
      0x00,
      0x00,
      0x00,
      0x00,
      0x0b, // end
    ]);
    return WebAssembly.validate(simdTest);
  } catch {
    return false;
  }
}

/**
 * Set up arena views over WASM memory.
 * Called after WASM memory is allocated.
 */
function setupArenaViews(): void {
  if (!wasmMemory) return;

  const buffer = wasmMemory.buffer;
  // Create TypedArray views over WASM memory for arena buffers
  // These views are backed by WASM memory, eliminating JS heap allocation
  arenaCvStack = new Uint32Array(buffer, SIMD_MEMORY.CV_STACK, 64 * 8); // 64 levels × 8 words
  arenaParentBlock = new Uint32Array(buffer, SIMD_MEMORY.PARENT_BLOCK, 16); // 16 words
  arenaChunkCv = new Uint32Array(buffer, SIMD_MEMORY.CHUNK_CV, 8); // 8 words
  arenaTempCvs = new Uint32Array(buffer, SIMD_MEMORY.TEMP_CVS, 32); // 4 × 8 words

  // Batch mode views
  // 16 positions × 16 v128 words = 16 × 64 u32 words = 1024 words per position? No...
  // In u32 terms: 16 positions × 16 words × 4 lanes = 1024 u32 values total
  arenaBatchBlockWords = new Uint32Array(buffer, SIMD_MEMORY.BATCH_BLOCK_WORDS, 16 * 16 * 4); // 16 pos × 16 words × 4 lanes
  arenaBatchCv = new Uint32Array(buffer, SIMD_MEMORY.BATCH_CV, 32); // 4 × 8 words
  arenaBatchCounterLow = new Uint32Array(buffer, SIMD_MEMORY.BATCH_COUNTER_LOW, 4); // 4 words
  arenaBatchFlagsBase = new Uint32Array(buffer, SIMD_MEMORY.BATCH_FLAGS_BASE, 4); // 4 words
  arenaBatchOutput = new Uint32Array(buffer, SIMD_MEMORY.BATCH_OUTPUT, 32); // 4 × 8 words
}

/**
 * Initialize the WASM SIMD module synchronously.
 * Call this once before using compress4x.
 */
// Cache generated WASM bytes to avoid regenerating on each init
let cachedWasmBytes: Uint8Array | null = null;

export function initSimdSync(): boolean {
  if (wasmInstance) return true;

  if (!isSimdSupported()) {
    return false;
  }

  try {
    const wasmBytes = cachedWasmBytes || generateWasmBytes();
    cachedWasmBytes = wasmBytes;
    wasmMemory = new WebAssembly.Memory({ initial: 1 });

    const importObject = {
      js: { mem: wasmMemory },
    };

    const module = new WebAssembly.Module(wasmBytes.buffer as ArrayBuffer);
    wasmInstance = new WebAssembly.Instance(module, importObject);
    wasmCompress4x = wasmInstance.exports.compress4x as () => void;
    wasmCompressChunks4x = wasmInstance.exports.compressChunks4x as () => void;
    wasmCompressParent = wasmInstance.exports.compressParent as () => void;
    wasmMemoryView = new Uint8Array(wasmMemory.buffer);
    wasmMemoryView32 = new Uint32Array(wasmMemory.buffer);

    // Set up arena views for Merkle tree operations
    setupArenaViews();

    return true;
  } catch (e) {
    console.warn("Failed to initialize WASM SIMD:", e);
    return false;
  }
}

/**
 * Memory offsets for SIMD data layout
 *
 * WASM Arena Pattern: All working buffers live in WASM memory (64KB page)
 * This eliminates JS heap allocations during hashing operations.
 */
export const SIMD_MEMORY = {
  // SIMD compress4x working area (used by WASM code) - single block
  BLOCK_WORDS: 0, // 4 x 16 words = 512 bytes (transposed layout)
  CHAINING_VALUES: 512, // 4 x 8 words = 128 bytes
  OUTPUT: 640, // 4 x 8 words = 128 bytes
  COUNTER_LOW: 768, // 4 words = 16 bytes
  COUNTER_HIGH: 784, // 4 words = 16 bytes
  BLOCK_LEN: 800, // 4 words = 16 bytes
  FLAGS: 816, // 4 words = 16 bytes
  // End of single-block SIMD working area: 832 bytes

  // SIMD compressChunks4x working area - 16 blocks batched
  // Each block position has 16 v128 values (one per message word) = 256 bytes
  // 16 block positions = 16 × 256 = 4096 bytes
  BATCH_BLOCK_WORDS: 832, // 16 positions × 256 bytes = 4096 bytes (transposed), ends at 4928
  BATCH_CV: 4928, // 4 × 8 words × 4 bytes = 128 bytes (working CVs), ends at 5056
  BATCH_COUNTER_LOW: 5056, // 4 words × 4 bytes = 16 bytes (per-chunk counters), ends at 5072
  BATCH_FLAGS_BASE: 5072, // 4 words × 4 bytes = 16 bytes (base flags, no START/END), ends at 5088
  BATCH_OUTPUT: 5088, // 4 × 8 words × 4 bytes = 128 bytes (final output), ends at 5216
  // End of batch working area: 5216 bytes

  // WASM Arena: JS working buffers (accessed via TypedArray views)
  CV_STACK: 5216, // 64 levels × 8 words × 4 bytes = 2048 bytes, ends at 7264
  PARENT_BLOCK: 7264, // 16 words × 4 bytes = 64 bytes, ends at 7328
  CHUNK_CV: 7328, // 8 words × 4 bytes = 32 bytes, ends at 7360
  TEMP_CVS: 7360, // 4 × 8 words × 4 bytes = 128 bytes, ends at 7488
  // Total arena usage: ~7488 bytes (fits comfortably in 64KB page)
} as const;

// Arena views - created once when SIMD initializes
let arenaCvStack: Uint32Array | null = null;
let arenaParentBlock: Uint32Array | null = null;
let arenaChunkCv: Uint32Array | null = null;
let arenaTempCvs: Uint32Array | null = null;

// Batch mode arena views
let arenaBatchBlockWords: Uint32Array | null = null;
let arenaBatchCv: Uint32Array | null = null;
let arenaBatchCounterLow: Uint32Array | null = null;
let arenaBatchFlagsBase: Uint32Array | null = null;
let arenaBatchOutput: Uint32Array | null = null;

/**
 * Get the WASM memory views for writing input data.
 */
export function getSimdMemory(): { view: Uint8Array; view32: Uint32Array } | null {
  if (!wasmMemoryView || !wasmMemoryView32) return null;
  return { view: wasmMemoryView, view32: wasmMemoryView32 };
}

/**
 * Get the arena buffers for Merkle tree operations.
 * These TypedArray views are backed by WASM memory - zero JS heap allocation.
 */
export function getArenaBuffers(): {
  cvStack: Uint32Array;
  parentBlock: Uint32Array;
  chunkCv: Uint32Array;
  tempCvs: Uint32Array;
} | null {
  if (!arenaCvStack || !arenaParentBlock || !arenaChunkCv || !arenaTempCvs) return null;
  return {
    cvStack: arenaCvStack,
    parentBlock: arenaParentBlock,
    chunkCv: arenaChunkCv,
    tempCvs: arenaTempCvs,
  };
}

/**
 * Get the batch arena buffers for chunk-level batched operations.
 * These TypedArray views are backed by WASM memory - zero JS heap allocation.
 */
export function getBatchArenaBuffers(): {
  blockWords: Uint32Array;
  cv: Uint32Array;
  counterLow: Uint32Array;
  flagsBase: Uint32Array;
  output: Uint32Array;
} | null {
  if (
    !arenaBatchBlockWords ||
    !arenaBatchCv ||
    !arenaBatchCounterLow ||
    !arenaBatchFlagsBase ||
    !arenaBatchOutput
  )
    return null;
  return {
    blockWords: arenaBatchBlockWords,
    cv: arenaBatchCv,
    counterLow: arenaBatchCounterLow,
    flagsBase: arenaBatchFlagsBase,
    output: arenaBatchOutput,
  };
}

/**
 * Run the compress4x function.
 * Data must already be set up in WASM memory.
 */
export function runCompress4x(): void {
  if (!wasmCompress4x) {
    throw new Error("WASM SIMD not initialized. Call initSimdSync() first.");
  }
  wasmCompress4x();
}

/**
 * Run the compressChunks4x function.
 * Processes 4 full chunks (16 blocks each) in a single WASM call.
 * Data must already be set up in batch arena buffers.
 */
export function runCompressChunks4x(): void {
  if (!wasmCompressChunks4x) {
    throw new Error("WASM SIMD not initialized. Call initSimdSync() first.");
  }
  wasmCompressChunks4x();
}

/**
 * Run the compressParent function.
 * Compresses a parent node: reads 16 words from PARENT_BLOCK, writes 8 words to CHUNK_CV.
 * Data must already be set up in arena buffers (PARENT_BLOCK at offset 7264).
 * Output is written to CHUNK_CV at offset 7328.
 */
export function runCompressParent(): void {
  if (!wasmCompressParent) {
    throw new Error("WASM SIMD not initialized. Call initSimdSync() first.");
  }
  wasmCompressParent();
}

/**
 * Check if SIMD is initialized and ready.
 */
export function isSimdReady(): boolean {
  return wasmCompress4x !== null;
}
