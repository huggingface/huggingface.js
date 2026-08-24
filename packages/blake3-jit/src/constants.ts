/**
 * BLAKE3 Constants
 *
 * IV values are the same as SHA-256: first 32 bits of the fractional parts
 * of the square roots of the first 8 primes (2..19)
 */

// Initialization Vector (same as SHA-256)
export const IV = new Uint32Array([
  0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19,
]);

// Domain separation flags
export const CHUNK_START = 1;
export const CHUNK_END = 1 << 1;
export const PARENT = 1 << 2;
export const ROOT = 1 << 3;
export const KEYED_HASH = 1 << 4;
export const DERIVE_KEY_CONTEXT = 1 << 5;
export const DERIVE_KEY_MATERIAL = 1 << 6;

// Size constants
export const OUT_LEN = 32;
export const KEY_LEN = 32;
export const BLOCK_LEN = 64;
export const CHUNK_LEN = 1024;

// Maximum depth of the CV stack (supports up to 2^54 bytes input)
export const MAX_DEPTH = 54;

/**
 * Precomputed message word permutations for all 7 rounds.
 *
 * The base permutation is: [2, 6, 3, 10, 7, 0, 4, 13, 1, 11, 12, 5, 9, 14, 15, 8]
 * Each subsequent permutation is the previous one with this permutation applied.
 *
 * These are the indices into the message block for each round.
 * By precomputing these, we avoid runtime permutation overhead.
 */
export const MSG_SCHEDULE: ReadonlyArray<ReadonlyArray<number>> = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
  [2, 6, 3, 10, 7, 0, 4, 13, 1, 11, 12, 5, 9, 14, 15, 8],
  [3, 4, 10, 12, 13, 2, 7, 14, 6, 5, 9, 0, 11, 15, 8, 1],
  [10, 7, 12, 9, 14, 3, 13, 15, 4, 0, 11, 2, 5, 8, 1, 6],
  [12, 13, 9, 11, 15, 10, 14, 8, 7, 2, 5, 3, 0, 1, 6, 4],
  [9, 14, 11, 5, 8, 12, 15, 1, 13, 3, 0, 10, 2, 6, 4, 7],
  [11, 15, 5, 0, 1, 9, 8, 6, 14, 10, 2, 12, 3, 4, 7, 13],
];

/**
 * Flattened permutation table for compress function optimization.
 * This enables direct indexed access: PERMUTATIONS[round * 16 + index]
 */
export const PERMUTATIONS = new Uint8Array([
  0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 2, 6, 3, 10, 7, 0, 4, 13, 1, 11, 12, 5, 9,
  14, 15, 8, 3, 4, 10, 12, 13, 2, 7, 14, 6, 5, 9, 0, 11, 15, 8, 1, 10, 7, 12, 9, 14, 3, 13, 15, 4,
  0, 11, 2, 5, 8, 1, 6, 12, 13, 9, 11, 15, 10, 14, 8, 7, 2, 5, 3, 0, 1, 6, 4, 9, 14, 11, 5, 8, 12,
  15, 1, 13, 3, 0, 10, 2, 6, 4, 7, 11, 15, 5, 0, 1, 9, 8, 6, 14, 10, 2, 12, 3, 4, 7, 13,
]);
