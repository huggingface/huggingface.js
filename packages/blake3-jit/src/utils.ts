/**
 * BLAKE3 Utility Functions
 *
 * Optimized for little-endian systems (most user-facing systems).
 * BLAKE3 is little-endian friendly - on little-endian systems we can
 * create Uint32Array views directly over input buffers.
 */

/**
 * Detect system endianness at module load time.
 * On little-endian systems, the byte 0x01 will be at index 0.
 */
export const IS_LITTLE_ENDIAN = new Uint8Array(new Uint32Array([0x01020304]).buffer)[0] === 0x04;

/**
 * Read 16 little-endian 32-bit words from a byte array into a Uint32Array.
 * This is only needed on big-endian systems.
 *
 * @param input - Source byte array
 * @param offset - Starting byte offset in input
 * @param words - Destination Uint32Array (must have at least 16 elements)
 */
export function readLittleEndianWordsFull(
  input: Uint8Array,
  offset: number,
  words: Uint32Array,
): void {
  for (let i = 0; i < 16; ++i, offset += 4) {
    words[i] =
      input[offset] |
      (input[offset + 1] << 8) |
      (input[offset + 2] << 16) |
      (input[offset + 3] << 24);
  }
}

/**
 * Read N little-endian 32-bit words from a byte array.
 * Handles partial reads (for final blocks).
 *
 * @param input - Source byte array
 * @param offset - Starting byte offset
 * @param words - Destination Uint32Array
 * @param wordCount - Number of words to read
 */
export function readLittleEndianWords(
  input: Uint8Array,
  offset: number,
  words: Uint32Array,
  wordCount: number,
): void {
  for (let i = 0; i < wordCount; ++i, offset += 4) {
    words[i] =
      input[offset] |
      (input[offset + 1] << 8) |
      (input[offset + 2] << 16) |
      (input[offset + 3] << 24);
  }
}

/**
 * Read a partial block with zero padding.
 * Used for the final block when input length is not a multiple of 64.
 *
 * @param input - Source byte array
 * @param offset - Starting byte offset
 * @param length - Number of bytes to read (< 64)
 * @param words - Destination Uint32Array (must have 16 elements)
 */
export function readLittleEndianWordsPartial(
  input: Uint8Array,
  offset: number,
  length: number,
  words: Uint32Array,
): void {
  // Zero out all words first
  words.fill(0);

  // Read full words
  const fullWords = length >>> 2;
  let i = 0;
  for (; i < fullWords; ++i, offset += 4) {
    words[i] =
      input[offset] |
      (input[offset + 1] << 8) |
      (input[offset + 2] << 16) |
      (input[offset + 3] << 24);
  }

  // Handle remaining bytes (0-3)
  const remaining = length & 3;
  if (remaining > 0) {
    let word = input[offset];
    if (remaining > 1) word |= input[offset + 1] << 8;
    if (remaining > 2) word |= input[offset + 2] << 16;
    words[i] = word;
  }
}

/**
 * Write 8 little-endian 32-bit words to a byte array.
 *
 * @param words - Source Uint32Array
 * @param wordOffset - Starting word offset in source
 * @param output - Destination byte array
 * @param byteOffset - Starting byte offset in destination
 */
export function writeLittleEndianWords(
  words: Uint32Array,
  wordOffset: number,
  output: Uint8Array,
  byteOffset: number,
): void {
  for (let i = 0; i < 8; ++i, byteOffset += 4) {
    const w = words[wordOffset + i];
    output[byteOffset] = w & 0xff;
    output[byteOffset + 1] = (w >>> 8) & 0xff;
    output[byteOffset + 2] = (w >>> 16) & 0xff;
    output[byteOffset + 3] = (w >>> 24) & 0xff;
  }
}

/**
 * Write N bytes from 32-bit words to output.
 * Used for variable-length output (XOF mode).
 *
 * @param words - Source Uint32Array
 * @param wordOffset - Starting word offset
 * @param output - Destination byte array
 * @param byteOffset - Starting byte offset in destination
 * @param byteCount - Number of bytes to write
 */
export function writeLittleEndianBytesPartial(
  words: Uint32Array,
  wordOffset: number,
  output: Uint8Array,
  byteOffset: number,
  byteCount: number,
): void {
  const fullWords = byteCount >>> 2;
  let i = 0;

  // Write full words
  for (; i < fullWords; ++i, byteOffset += 4) {
    const w = words[wordOffset + i];
    output[byteOffset] = w & 0xff;
    output[byteOffset + 1] = (w >>> 8) & 0xff;
    output[byteOffset + 2] = (w >>> 16) & 0xff;
    output[byteOffset + 3] = (w >>> 24) & 0xff;
  }

  // Write remaining bytes
  const remaining = byteCount & 3;
  if (remaining > 0) {
    const w = words[wordOffset + i];
    output[byteOffset] = w & 0xff;
    if (remaining > 1) output[byteOffset + 1] = (w >>> 8) & 0xff;
    if (remaining > 2) output[byteOffset + 2] = (w >>> 16) & 0xff;
  }
}

/**
 * Encode a UTF-8 string to Uint8Array.
 * Used for derive_key context strings.
 */
export function encodeUTF8(str: string): Uint8Array {
  if (typeof TextEncoder !== "undefined") {
    return new TextEncoder().encode(str);
  }
  // Fallback for older environments
  const bytes: number[] = [];
  for (let i = 0; i < str.length; i++) {
    let c = str.charCodeAt(i);
    if (c < 0x80) {
      bytes.push(c);
    } else if (c < 0x800) {
      bytes.push(0xc0 | (c >> 6), 0x80 | (c & 0x3f));
    } else if (c < 0xd800 || c >= 0xe000) {
      bytes.push(0xe0 | (c >> 12), 0x80 | ((c >> 6) & 0x3f), 0x80 | (c & 0x3f));
    } else {
      // Surrogate pair
      i++;
      c = 0x10000 + (((c & 0x3ff) << 10) | (str.charCodeAt(i) & 0x3ff));
      bytes.push(
        0xf0 | (c >> 18),
        0x80 | ((c >> 12) & 0x3f),
        0x80 | ((c >> 6) & 0x3f),
        0x80 | (c & 0x3f),
      );
    }
  }
  return new Uint8Array(bytes);
}

/**
 * De Bruijn lookup table for O(1) trailing zero count.
 * The expression (n & -n) isolates the lowest set bit.
 * Multiplying by the De Bruijn constant maps each power of 2 to a unique 5-bit index.
 */
const CTZ32_TABLE = new Uint8Array([
  0, 1, 28, 2, 29, 14, 24, 3, 30, 22, 20, 15, 25, 17, 4, 8, 31, 27, 13, 23, 21, 19, 16, 7, 26, 12,
  18, 6, 11, 5, 10, 9,
]);

/**
 * Count trailing zero bits in a 32-bit number using De Bruijn multiplication.
 * This is O(1) and branchless for non-zero inputs.
 *
 * For Merkle tree merge: ctz32(chunkCounter) tells us how many merges to do.
 */
export function ctz32(n: number): number {
  if (n === 0) return 32;
  // Use unsigned right shift to handle negative numbers correctly
  return CTZ32_TABLE[(((n & -n) * 0x077cb531) >>> 27) & 31];
}

/**
 * Count trailing zero bits in a 64-bit number.
 * Used to determine how many parent nodes to compute after adding a chunk.
 *
 * Note: JavaScript bitwise ops work on 32-bit signed integers,
 * so we need to handle 64-bit numbers carefully.
 */
export function countTrailingZeros(n: number): number {
  if (n === 0) return 64;

  // For numbers that fit in 32 bits
  const low = n | 0;
  if (low !== 0) {
    // Use Math.clz32 trick: ctz(x) = 31 - clz32(x & -x) for non-zero x
    return 31 - Math.clz32(low & -low);
  }

  // High 32 bits
  const high = (n / 0x100000000) | 0;
  if (high !== 0) {
    return 32 + (31 - Math.clz32(high & -high));
  }

  return 64;
}

/**
 * Create a Uint32Array view of a Uint8Array.
 * Only works correctly on little-endian systems when the offset is 4-byte aligned.
 *
 * @param arr - Source byte array
 * @param byteOffset - Starting byte offset (must be 4-byte aligned)
 * @param wordLength - Number of 32-bit words
 */
export function uint32View(arr: Uint8Array, byteOffset: number, wordLength: number): Uint32Array {
  return new Uint32Array(arr.buffer, arr.byteOffset + byteOffset, wordLength);
}
