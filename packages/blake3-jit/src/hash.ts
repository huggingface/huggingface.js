/**
 * BLAKE3 Hash Function - Simple one-shot API
 *
 * This provides a simple hash() function optimized for different input sizes.
 * For small inputs, uses pure JS. For large inputs, uses WASM SIMD.
 */

import { compress } from "./compress.js";
import {
  IV,
  CHUNK_START,
  CHUNK_END,
  PARENT,
  ROOT,
  BLOCK_LEN,
  CHUNK_LEN,
  OUT_LEN,
} from "./constants.js";
import {
  IS_LITTLE_ENDIAN,
  readLittleEndianWordsFull,
  readLittleEndianWordsPartial,
  writeLittleEndianBytesPartial,
} from "./utils.js";
import {
  initSimdSync,
  getSimdMemory,
  getArenaBuffers,
  runCompress4x,
  runCompressChunks4x,
  runCompressParent,
  SIMD_MEMORY,
} from "./wasm-simd.js";

// Pre-allocated buffers for reuse (single-threaded optimization)
let blockWords: Uint32Array | null = null;

// ===== Contiguous Hyper CV Stack (Optimization #6) =====
// Maximum tree depth for practical inputs (2^64 chunks = essentially unlimited)
// Fixed allocation at module load - no runtime allocation
const CV_STACK_DEPTH = 64;
const HYPER_CV_STACK = new Uint32Array(CV_STACK_DEPTH * 8); // 64 CVs × 8 words = 512 words

// Pre-computed offsets for the first few stack levels (hot path optimization)
// Note: These can be used for further optimization if needed
// const CV_STACK_OFF_0 = 0;
// const CV_STACK_OFF_1 = 8;
// const CV_STACK_OFF_2 = 16;
// const CV_STACK_OFF_3 = 24;

// ===== Pre-allocated CV Pool with Views (avoids subarray() in hot paths) =====
const CV_POOL_SIZE = 64;
const CV_POOL = new Uint32Array(CV_POOL_SIZE * 8); // 64 CVs × 8 words = 512 words
const CV_VIEWS: Uint32Array[] = [];
for (let i = 0; i < CV_POOL_SIZE; i++) {
  CV_VIEWS.push(CV_POOL.subarray(i * 8, i * 8 + 8));
}

// SIMD initialization state
let simdAvailable = false;

// Threshold for switching to SIMD (must be > 1 chunk to benefit from parallelism)
const SIMD_THRESHOLD = 4 * CHUNK_LEN; // 4KB - need at least 4 chunks for SIMD benefit

/**
 * Initialize SIMD synchronously (lazy).
 */
function ensureSimdSync(): boolean {
  if (simdAvailable) return true;
  simdAvailable = initSimdSync();
  return simdAvailable;
}

// Reusable buffer for SIMD chunk CVs (4 chunks × 8 words)
const simdChunkCvs = new Uint32Array(32);

// ===== Module-level reusable buffers (single-threaded safe) =====
// These eliminate heap allocations in hot paths

// For hashChunkWithWords() and hashChunkRoot()
const reusableTempCv = new Uint32Array(8);

// For hashPureJS()
const reusableChunkCv = new Uint32Array(8);
const reusablePureParentBlock = new Uint32Array(16);
const reusablePureParentCv = new Uint32Array(8);

// For hashSimd() - use flat array for 4 chunk CVs (access via subarray)
const reusableSimdCvs = new Uint32Array(32); // 4 × 8 words flat

// For hashSimd() parent compression
const reusableSimdParentBlock = new Uint32Array(16);
const reusableSimdParentCv = new Uint32Array(8);

// For hashSimd() parameters - TypedArrays instead of JS arrays
const reusableOffsets = new Uint32Array(4);
const reusableCounters = new Uint32Array(4);
const reusableBlockLens = new Uint32Array(4);
const reusableFlags = new Uint32Array(4);

// Reusable output buffer for common 32-byte hash (eliminates allocations)
const reusableOut8 = new Uint32Array(8); // Standard 32-byte output
// Pre-created view to avoid allocation in hot path (Task 1 optimization)
const reusableOut8View = new Uint8Array(reusableOut8.buffer, 0, 32);

// ===== Unrolled CV Copy Helper (Task 7 optimization) =====
// V8 will inline this - avoids loop overhead in hot paths
function copyCV8(src: Uint32Array, srcOff: number, dst: Uint32Array, dstOff: number): void {
  dst[dstOff] = src[srcOff];
  dst[dstOff + 1] = src[srcOff + 1];
  dst[dstOff + 2] = src[srcOff + 2];
  dst[dstOff + 3] = src[srcOff + 3];
  dst[dstOff + 4] = src[srcOff + 4];
  dst[dstOff + 5] = src[srcOff + 5];
  dst[dstOff + 6] = src[srcOff + 6];
  dst[dstOff + 7] = src[srcOff + 7];
}

/**
 * Transpose 4 blocks (64 bytes each) into SIMD memory layout.
 * The SIMD compress4x expects: [m0_0,m0_1,m0_2,m0_3, m1_0,m1_1,m1_2,m1_3, ...]
 * where m{i}_{j} is message word i from block j.
 *
 * OPTIMIZED: Processes all 4 blocks together for each word position,
 * writing 4 consecutive u32s at once for better cache locality.
 *
 * @param inputWords - Pre-created Uint32Array view of input (null if unaligned/non-LE).
 *                     Created once per hash call to avoid allocation in hot loop.
 */
function transposeBlocksToSimd(
  input: Uint8Array,
  offsets: Uint32Array, // Starting offsets for each of 4 blocks
  blockLens: Uint32Array, // Length of each block (0-64 bytes)
  mem32: Uint32Array,
  blockCount: number, // 1-4 blocks
  inputWords: Uint32Array | null, // Pre-created view passed from caller
): void {
  // Fast path: all blocks are full 64-byte blocks with aligned LE input
  const allFull =
    blockCount === 4 &&
    blockLens[0] === 64 &&
    blockLens[1] === 64 &&
    blockLens[2] === 64 &&
    blockLens[3] === 64;

  if (
    allFull &&
    inputWords &&
    offsets[0] % 4 === 0 &&
    offsets[1] % 4 === 0 &&
    offsets[2] % 4 === 0 &&
    offsets[3] % 4 === 0
  ) {
    // Ultra-fast path: process all 4 blocks together, write 4 consecutive u32s per word
    const wordOff0 = offsets[0] >>> 2;
    const wordOff1 = offsets[1] >>> 2;
    const wordOff2 = offsets[2] >>> 2;
    const wordOff3 = offsets[3] >>> 2;

    for (let w = 0; w < 16; w++) {
      const dstBase = w * 4;
      mem32[dstBase] = inputWords[wordOff0 + w];
      mem32[dstBase + 1] = inputWords[wordOff1 + w];
      mem32[dstBase + 2] = inputWords[wordOff2 + w];
      mem32[dstBase + 3] = inputWords[wordOff3 + w];
    }
    return;
  }

  // Standard path: process each block independently (handles partial blocks)
  for (let b = 0; b < blockCount; b++) {
    const len = blockLens[b];
    const off = offsets[b];

    if (len === 64) {
      // Full block
      if (inputWords && off % 4 === 0) {
        // Direct Uint32Array access for aligned LE blocks
        const wordOff = off >>> 2;
        for (let w = 0; w < 16; w++) {
          mem32[w * 4 + b] = inputWords[wordOff + w];
        }
      } else {
        // Byte-by-byte reconstruction
        for (let w = 0; w < 16; w++) {
          const srcOff = off + w * 4;
          mem32[w * 4 + b] =
            input[srcOff] |
            (input[srcOff + 1] << 8) |
            (input[srcOff + 2] << 16) |
            (input[srcOff + 3] << 24);
        }
      }
    } else if (len === 0) {
      // Zero block
      for (let w = 0; w < 16; w++) {
        mem32[w * 4 + b] = 0;
      }
    } else {
      // Partial block - handle word by word
      for (let w = 0; w < 16; w++) {
        const wordOff = w * 4;
        if (wordOff >= len) {
          mem32[w * 4 + b] = 0;
        } else if (wordOff + 4 <= len) {
          const srcOff = off + wordOff;
          mem32[w * 4 + b] =
            input[srcOff] |
            (input[srcOff + 1] << 8) |
            (input[srcOff + 2] << 16) |
            (input[srcOff + 3] << 24);
        } else {
          // Partial word at end of block
          let word = 0;
          for (let i = 0; i < len - wordOff; i++) {
            word |= input[off + wordOff + i] << (i * 8);
          }
          mem32[w * 4 + b] = word;
        }
      }
    }
  }

  // Zero unused block slots
  for (let b = blockCount; b < 4; b++) {
    for (let w = 0; w < 16; w++) {
      mem32[w * 4 + b] = 0;
    }
  }
}

/**
 * Transpose 4 full chunks (4 × 16 blocks = 64 blocks) into batch SIMD memory.
 * This is used for the batched compressChunks4x function that processes
 * all 16 blocks in a single WASM call.
 *
 * Memory layout: BATCH_BLOCK_WORDS has 16 positions, each with 16 v128 values.
 * Position p, word w: mem32[(p * 64) + (w * 4) + lane]
 *
 * OPTIMIZED: Processes all 4 chunks together for each (pos, word) pair,
 * writing 4 consecutive u32s at once for better cache locality.
 *
 * @param input - Input data (must have at least 4 full chunks = 4096 bytes)
 * @param chunkOffsets - Starting offsets for each of 4 chunks
 * @param mem32 - WASM memory view
 * @param inputWords - Pre-created Uint32Array view (null if unaligned)
 */
function transposeBatchToSimd(
  input: Uint8Array,
  chunkOffsets: Uint32Array,
  mem32: Uint32Array,
  inputWords: Uint32Array | null,
): void {
  const BATCH_BASE = SIMD_MEMORY.BATCH_BLOCK_WORDS / 4;

  // Get base word offsets for each chunk (pre-computed for fast path)
  const chunk0WordBase = chunkOffsets[0] >>> 2;
  const chunk1WordBase = chunkOffsets[1] >>> 2;
  const chunk2WordBase = chunkOffsets[2] >>> 2;
  const chunk3WordBase = chunkOffsets[3] >>> 2;

  // Fast path: all chunks aligned and LE - process 4 consecutive u32s at once
  if (inputWords && chunkOffsets[0] % 4 === 0) {
    for (let pos = 0; pos < 16; pos++) {
      const posBase = BATCH_BASE + pos * 64; // 16 words × 4 lanes = 64
      const blockWordOff = pos * 16; // 16 words per block (64 bytes / 4)

      // Process all 16 words, writing 4 chunks at a time (cache-friendly: 16 bytes per write group)
      for (let w = 0; w < 16; w++) {
        const dstBase = posBase + w * 4;
        // Read word w from all 4 chunks at positions that become consecutive in output
        mem32[dstBase] = inputWords[chunk0WordBase + blockWordOff + w];
        mem32[dstBase + 1] = inputWords[chunk1WordBase + blockWordOff + w];
        mem32[dstBase + 2] = inputWords[chunk2WordBase + blockWordOff + w];
        mem32[dstBase + 3] = inputWords[chunk3WordBase + blockWordOff + w];
      }
    }
  } else {
    // Slow path: byte-by-byte reconstruction, still cache-friendly write pattern
    for (let pos = 0; pos < 16; pos++) {
      const posBase = BATCH_BASE + pos * 64;
      const blockByteOff = pos * 64; // 64 bytes per block

      for (let w = 0; w < 16; w++) {
        const dstBase = posBase + w * 4;
        const wordByteOff = w * 4;

        // Chunk 0
        const off0 = chunkOffsets[0] + blockByteOff + wordByteOff;
        mem32[dstBase] =
          input[off0] | (input[off0 + 1] << 8) | (input[off0 + 2] << 16) | (input[off0 + 3] << 24);

        // Chunk 1
        const off1 = chunkOffsets[1] + blockByteOff + wordByteOff;
        mem32[dstBase + 1] =
          input[off1] | (input[off1 + 1] << 8) | (input[off1 + 2] << 16) | (input[off1 + 3] << 24);

        // Chunk 2
        const off2 = chunkOffsets[2] + blockByteOff + wordByteOff;
        mem32[dstBase + 2] =
          input[off2] | (input[off2 + 1] << 8) | (input[off2 + 2] << 16) | (input[off2 + 3] << 24);

        // Chunk 3
        const off3 = chunkOffsets[3] + blockByteOff + wordByteOff;
        mem32[dstBase + 3] =
          input[off3] | (input[off3 + 1] << 8) | (input[off3 + 2] << 16) | (input[off3 + 3] << 24);
      }
    }
  }
}

// Pre-computed memory offsets for SIMD operations (single-block mode)
const SIMD_CV_BASE = SIMD_MEMORY.CHAINING_VALUES / 4;
const SIMD_OUT_BASE = SIMD_MEMORY.OUTPUT / 4;
const SIMD_COUNTER_LOW_BASE = SIMD_MEMORY.COUNTER_LOW / 4;
const SIMD_COUNTER_HIGH_BASE = SIMD_MEMORY.COUNTER_HIGH / 4;
const SIMD_BLOCK_LEN_BASE = SIMD_MEMORY.BLOCK_LEN / 4;

// Pre-computed memory offsets for batch SIMD operations (16-block mode)
const BATCH_CV_BASE = SIMD_MEMORY.BATCH_CV / 4;
const BATCH_COUNTER_LOW_BASE = SIMD_MEMORY.BATCH_COUNTER_LOW / 4;
const BATCH_FLAGS_BASE_OFFSET = SIMD_MEMORY.BATCH_FLAGS_BASE / 4;
const BATCH_OUTPUT_BASE = SIMD_MEMORY.BATCH_OUTPUT / 4;

// Reusable arrays for batch processing
const batchChunkOffsets = new Uint32Array(4);
const SIMD_FLAGS_BASE = SIMD_MEMORY.FLAGS / 4;

/**
 * Set up chaining values in SIMD memory (transposed layout).
 * Optimized: unrolled loops for common case of 4 chunks.
 * cvs is flat: [cv0_word0..cv0_word7, cv1_word0..cv1_word7, ...]
 */
function setupSimdCvs(
  cvs: Uint32Array, // Flat array: 4 × 8 words
  mem32: Uint32Array,
  count: number,
): void {
  // Unrolled for 4 chunks (common case)
  if (count === 4) {
    for (let w = 0; w < 8; w++) {
      const base = SIMD_CV_BASE + w * 4;
      mem32[base] = cvs[w]; // cv0[w]
      mem32[base + 1] = cvs[8 + w]; // cv1[w]
      mem32[base + 2] = cvs[16 + w]; // cv2[w]
      mem32[base + 3] = cvs[24 + w]; // cv3[w]
    }
  } else {
    for (let w = 0; w < 8; w++) {
      const base = SIMD_CV_BASE + w * 4;
      for (let c = 0; c < count; c++) {
        mem32[base + c] = cvs[c * 8 + w];
      }
      for (let c = count; c < 4; c++) {
        mem32[base + c] = 0;
      }
    }
  }
}

/**
 * Set up SIMD parameters (counters, flags, block lengths).
 */
function setupSimdParams(
  mem32: Uint32Array,
  counters: Uint32Array,
  blockLens: Uint32Array,
  flagsArr: Uint32Array,
  count: number,
): void {
  // Most chunk counters fit in 32 bits, so counter high is usually 0
  for (let i = 0; i < count; i++) {
    mem32[SIMD_COUNTER_LOW_BASE + i] = counters[i];
    mem32[SIMD_COUNTER_HIGH_BASE + i] = 0; // Assume counters fit in 32 bits
    mem32[SIMD_BLOCK_LEN_BASE + i] = blockLens[i];
    mem32[SIMD_FLAGS_BASE + i] = flagsArr[i];
  }
  // Zero unused slots
  for (let i = count; i < 4; i++) {
    mem32[SIMD_COUNTER_LOW_BASE + i] = 0;
    mem32[SIMD_COUNTER_HIGH_BASE + i] = 0;
    mem32[SIMD_BLOCK_LEN_BASE + i] = 0;
    mem32[SIMD_FLAGS_BASE + i] = 0;
  }
}

/**
 * Read output CVs from SIMD memory (untranspose).
 */
function readSimdOutputCvs(
  mem32: Uint32Array,
  outputCvs: Uint32Array, // Flat array: 4 × 8 words
  count: number,
): void {
  // Unrolled for 4 chunks (common case)
  if (count === 4) {
    for (let w = 0; w < 8; w++) {
      const base = SIMD_OUT_BASE + w * 4;
      outputCvs[w] = mem32[base];
      outputCvs[8 + w] = mem32[base + 1];
      outputCvs[16 + w] = mem32[base + 2];
      outputCvs[24 + w] = mem32[base + 3];
    }
  } else {
    for (let w = 0; w < 8; w++) {
      const base = SIMD_OUT_BASE + w * 4;
      for (let c = 0; c < count; c++) {
        outputCvs[c * 8 + w] = mem32[base + c];
      }
    }
  }
}

function getBlockWords(): Uint32Array {
  if (!blockWords) {
    blockWords = new Uint32Array(16);
  }
  return blockWords;
}

/**
 * Hash a single chunk (up to 1024 bytes) with pre-created inputWords view.
 * This is the optimized version that avoids creating Uint32Array views per chunk.
 * (Fleek optimization Step 8)
 */
function hashChunkWithWords(
  input: Uint8Array,
  inputWords: Uint32Array | null, // Pre-created view of entire input
  inputOffset: number,
  inputLen: number,
  chunkCounter: number,
  flags: number,
  cv: Uint32Array,
  cvOffset: number,
): void {
  // Use reusable temporary CV for intermediate blocks (single-threaded safe)
  reusableTempCv.set(IV);

  // Process full blocks
  const fullBlocks = inputLen >>> 6; // inputLen / 64
  const remainder = inputLen & 63; // inputLen % 64

  // Calculate word offset for this chunk within the pre-created view
  const chunkWordOffset = inputOffset >>> 2;

  // Fast path for full chunks with aligned little-endian input
  if (inputWords && remainder === 0 && inputLen === CHUNK_LEN) {
    // All 16 blocks are full, use fast path exclusively
    let wordOff = chunkWordOffset;
    // Block 0 (CHUNK_START)
    compress(
      reusableTempCv,
      0,
      inputWords,
      wordOff,
      reusableTempCv,
      0,
      false,
      chunkCounter,
      BLOCK_LEN,
      flags | CHUNK_START,
    );
    wordOff += 16;
    // Blocks 1-14 (no special flags)
    for (let i = 1; i < 15; i++) {
      compress(
        reusableTempCv,
        0,
        inputWords,
        wordOff,
        reusableTempCv,
        0,
        false,
        chunkCounter,
        BLOCK_LEN,
        flags,
      );
      wordOff += 16;
    }
    // Block 15 (CHUNK_END)
    compress(
      reusableTempCv,
      0,
      inputWords,
      wordOff,
      reusableTempCv,
      0,
      false,
      chunkCounter,
      BLOCK_LEN,
      flags | CHUNK_END,
    );

    cv.set(reusableTempCv, cvOffset);
    return;
  }

  // Slower path for partial chunks or non-aligned input
  const totalBlocks = fullBlocks + (remainder > 0 ? 1 : 0);
  const block = getBlockWords();

  for (let blockIdx = 0; blockIdx < totalBlocks; blockIdx++) {
    const isFirst = blockIdx === 0;
    const isLast = blockIdx === totalBlocks - 1;
    const blockStart = blockIdx << 6;
    const blockLen = isLast && remainder > 0 ? remainder : BLOCK_LEN;

    // Determine flags for this block
    let blockFlags = flags;
    if (isFirst) blockFlags |= CHUNK_START;
    if (isLast) blockFlags |= CHUNK_END;

    // Load block words
    if (isLast && remainder > 0) {
      // Partial final block - need zero padding
      readLittleEndianWordsPartial(input, inputOffset + blockStart, blockLen, block);
    } else if (inputWords && chunkWordOffset + (blockStart >>> 2) + 16 <= inputWords.length) {
      // Fast path: use pre-created view directly
      compress(
        reusableTempCv,
        0,
        inputWords,
        chunkWordOffset + (blockStart >>> 2),
        reusableTempCv,
        0,
        false,
        chunkCounter,
        blockLen,
        blockFlags,
      );
      continue;
    } else {
      readLittleEndianWordsFull(input, inputOffset + blockStart, block);
    }

    compress(
      reusableTempCv,
      0,
      block,
      0,
      reusableTempCv,
      0,
      false,
      chunkCounter,
      blockLen,
      blockFlags,
    );
  }

  // Copy result to output
  cv.set(reusableTempCv, cvOffset);
}

/**
 * Hash input using pure JavaScript.
 * Handles the full Merkle tree construction.
 */
function hashPureJS(input: Uint8Array, outputLen: number): Uint8Array {
  const inputLen = input.length;

  // Special case: empty input
  if (inputLen === 0) {
    const block = getBlockWords();
    block.fill(0);
    // Use reusable output buffer for common 32-byte case
    const out = outputLen === 32 ? reusableOut8 : new Uint32Array(outputLen > 32 ? 16 : 8);

    compress(IV, 0, block, 0, out, 0, outputLen > 32, 0, 0, CHUNK_START | CHUNK_END | ROOT);

    // Return result - use pre-created view for common 32-byte case
    if (outputLen === 32 && IS_LITTLE_ENDIAN) {
      return reusableOut8View.slice();
    }
    const result = new Uint8Array(outputLen);
    if (IS_LITTLE_ENDIAN) {
      result.set(new Uint8Array(out.buffer, 0, outputLen));
    } else {
      writeLittleEndianBytesPartial(out, 0, result, 0, outputLen);
    }
    return result;
  }

  // Calculate number of chunks
  const numChunks = Math.ceil(inputLen / CHUNK_LEN);

  // Single chunk optimization
  if (numChunks === 1) {
    // Use reusable output buffer for common 32-byte case
    const cv = outputLen === 32 ? reusableOut8 : new Uint32Array(outputLen > 32 ? 16 : 8);
    hashChunkRoot(input, 0, inputLen, 0, 0, cv, outputLen > 32);

    // Return result - use pre-created view for common 32-byte case
    if (outputLen === 32 && IS_LITTLE_ENDIAN) {
      return reusableOut8View.slice();
    }
    const result = new Uint8Array(outputLen);
    if (IS_LITTLE_ENDIAN) {
      result.set(new Uint8Array(cv.buffer, 0, outputLen));
    } else {
      writeLittleEndianBytesPartial(cv, 0, result, 0, outputLen);
    }
    return result;
  }

  // Multiple chunks - need Merkle tree
  // Use the global contiguous CV stack (no allocation)
  const stack = HYPER_CV_STACK;
  let stackLen = 0;

  // Use reusable buffers (single-threaded safe)
  const chunkCv = reusableChunkCv;
  const parentBlock = reusablePureParentBlock;
  const parentCv = reusablePureParentCv;

  // Create Uint32Array view ONCE for entire input (Fleek optimization Step 8)
  // This avoids creating views inside each chunk/block processing
  let inputWords: Uint32Array | null = null;
  const canUseFastPath = IS_LITTLE_ENDIAN && input.byteOffset % 4 === 0;
  if (canUseFastPath) {
    inputWords = new Uint32Array(input.buffer, input.byteOffset, inputLen >>> 2);
  }

  // Determine how many full chunks we have
  const fullChunks = inputLen >>> 10; // inputLen / 1024
  const lastChunkLen = inputLen & 1023; // inputLen % 1024

  // Process all full chunks with fast path (inlined for performance)
  if (canUseFastPath && inputWords) {
    for (let chunkIdx = 0; chunkIdx < fullChunks; chunkIdx++) {
      // Inline chunk processing for full chunks
      chunkCv.set(IV);
      let wordOff = chunkIdx << 8; // chunkIdx * 256 (CHUNK_LEN/4)

      // Block 0 (CHUNK_START)
      compress(
        chunkCv,
        0,
        inputWords,
        wordOff,
        chunkCv,
        0,
        false,
        chunkIdx,
        BLOCK_LEN,
        CHUNK_START,
      );
      wordOff += 16;
      // Blocks 1-14 (no special flags)
      for (let b = 1; b < 15; b++) {
        compress(chunkCv, 0, inputWords, wordOff, chunkCv, 0, false, chunkIdx, BLOCK_LEN, 0);
        wordOff += 16;
      }
      // Block 15 (CHUNK_END)
      compress(chunkCv, 0, inputWords, wordOff, chunkCv, 0, false, chunkIdx, BLOCK_LEN, CHUNK_END);

      // Merge completed subtrees (avoid subarray by using index math)
      let totalChunks = chunkIdx + 1;
      let cvSrcOff = 0;
      let cvSrc = chunkCv;

      // Check if this is the last chunk overall
      const isLastChunk = chunkIdx === fullChunks - 1 && lastChunkLen === 0;

      while ((totalChunks & 1) === 0 && stackLen > 0) {
        // Skip final merge if it would produce the root; let finalization handle it with ROOT flag
        if (stackLen === 1 && isLastChunk) {
          break;
        }
        stackLen--;
        const stackOff = stackLen * 8;
        // Copy left CV from stack to parentBlock[0..7] (unrolled)
        copyCV8(stack, stackOff, parentBlock, 0);
        // Copy current CV to parentBlock[8..15] (unrolled)
        copyCV8(cvSrc, cvSrcOff, parentBlock, 8);

        compress(IV, 0, parentBlock, 0, parentCv, 0, false, 0, BLOCK_LEN, PARENT);
        cvSrc = parentCv;
        cvSrcOff = 0;
        totalChunks >>>= 1;
      }

      // Push CV to stack (unrolled)
      const stackOff = stackLen * 8;
      copyCV8(cvSrc, cvSrcOff, stack, stackOff);
      stackLen++;
    }

    // Process last partial chunk if any
    if (lastChunkLen > 0) {
      hashChunkWithWords(
        input,
        inputWords,
        fullChunks * CHUNK_LEN,
        lastChunkLen,
        fullChunks,
        0,
        chunkCv,
        0,
      );

      let totalChunks = fullChunks + 1;
      let newCv = chunkCv;
      let newCvOffset = 0;

      while ((totalChunks & 1) === 0 && stackLen > 0) {
        // Skip final merge; this IS the last chunk, let finalization handle ROOT flag
        if (stackLen === 1) {
          break;
        }
        stackLen--;
        const stackOff = stackLen * 8;
        // Copy from stack to parentBlock[0..7] (unrolled)
        copyCV8(stack, stackOff, parentBlock, 0);
        // Copy from newCv to parentBlock[8..15] (unrolled)
        copyCV8(newCv, newCvOffset, parentBlock, 8);
        compress(IV, 0, parentBlock, 0, parentCv, 0, false, 0, BLOCK_LEN, PARENT);
        newCv = parentCv;
        newCvOffset = 0;
        totalChunks >>>= 1;
      }

      // Push CV to stack (unrolled)
      const pushOff = stackLen * 8;
      copyCV8(newCv, newCvOffset, stack, pushOff);
      stackLen++;
    }
  } else {
    // Slow path for unaligned or big-endian
    for (let chunkIdx = 0; chunkIdx < numChunks; chunkIdx++) {
      const chunkStart = chunkIdx * CHUNK_LEN;
      const chunkLen = Math.min(CHUNK_LEN, inputLen - chunkStart);

      hashChunkWithWords(input, inputWords, chunkStart, chunkLen, chunkIdx, 0, chunkCv, 0);

      // Merge completed subtrees
      let totalChunks = chunkIdx + 1;
      let newCv = chunkCv;
      let newCvOffset = 0;

      // Check if this is the last chunk
      const isLastChunk = chunkIdx === numChunks - 1;

      while ((totalChunks & 1) === 0 && stackLen > 0) {
        // Skip final merge if it would produce the root; let finalization handle it with ROOT flag
        if (stackLen === 1 && isLastChunk) {
          break;
        }
        stackLen--;
        const stackOff = stackLen * 8;
        // Copy from stack to parentBlock[0..7] (unrolled)
        copyCV8(stack, stackOff, parentBlock, 0);
        // Copy from newCv to parentBlock[8..15] (unrolled)
        copyCV8(newCv, newCvOffset, parentBlock, 8);
        compress(IV, 0, parentBlock, 0, parentCv, 0, false, 0, BLOCK_LEN, PARENT);
        newCv = parentCv;
        newCvOffset = 0;
        totalChunks >>>= 1;
      }

      // Push CV to stack (unrolled)
      const pushOff = stackLen * 8;
      copyCV8(newCv, newCvOffset, stack, pushOff);
      stackLen++;
    }
  }

  // Finalize: merge remaining stack entries
  while (stackLen > 1) {
    stackLen--;
    const rightOff = stackLen * 8;
    stackLen--;
    const leftOff = stackLen * 8;
    // Copy left CV to parentBlock[0..7] and right CV to parentBlock[8..15] (unrolled)
    copyCV8(stack, leftOff, parentBlock, 0);
    copyCV8(stack, rightOff, parentBlock, 8);

    if (stackLen === 0) {
      // This is the root - use reusable output buffer for common 32-byte case
      const out = outputLen === 32 ? reusableOut8 : new Uint32Array(outputLen > 32 ? 16 : 8);
      compress(IV, 0, parentBlock, 0, out, 0, outputLen > 32, 0, BLOCK_LEN, PARENT | ROOT);

      // Return result - use pre-created view for common 32-byte case
      if (outputLen === 32 && IS_LITTLE_ENDIAN) {
        return reusableOut8View.slice();
      }
      const result = new Uint8Array(outputLen);
      if (IS_LITTLE_ENDIAN) {
        result.set(new Uint8Array(out.buffer, 0, outputLen));
      } else {
        writeLittleEndianBytesPartial(out, 0, result, 0, outputLen);
      }
      return result;
    }

    compress(IV, 0, parentBlock, 0, parentCv, 0, false, 0, BLOCK_LEN, PARENT);

    // Push to stack (unrolled)
    copyCV8(parentCv, 0, stack, stackLen * 8);
    stackLen++;
  }

  // Single entry in stack - this is the root
  const out = outputLen === 32 ? reusableOut8 : new Uint32Array(outputLen > 32 ? 16 : 8);
  const lastBlock = getBlockWords();
  lastBlock.fill(0);
  // Copy first 8 words from stack (unrolled)
  copyCV8(stack, 0, lastBlock, 0);

  compress(IV, 0, lastBlock, 0, out, 0, outputLen > 32, 0, BLOCK_LEN, ROOT);

  // Return result - use pre-created view for common 32-byte case
  if (outputLen === 32 && IS_LITTLE_ENDIAN) {
    return reusableOut8View.slice();
  }
  const result = new Uint8Array(outputLen);
  if (IS_LITTLE_ENDIAN) {
    result.set(new Uint8Array(out.buffer, 0, outputLen));
  } else {
    writeLittleEndianBytesPartial(out, 0, result, 0, outputLen);
  }
  return result;
}

/**
 * Hash a single chunk that is also the root (single chunk input).
 */
function hashChunkRoot(
  input: Uint8Array,
  inputOffset: number,
  inputLen: number,
  chunkCounter: number,
  flags: number,
  out: Uint32Array,
  fullOutput: boolean,
): void {
  // Use reusable tempCv (single-threaded safe)
  reusableTempCv.set(IV);

  const block = getBlockWords();

  // Process full blocks
  const fullBlocks = inputLen >>> 6;
  const remainder = inputLen & 63;
  const totalBlocks = fullBlocks + (remainder > 0 ? 1 : 0) || 1; // At least 1 block

  // Create a Uint32Array view if possible
  let inputWords: Uint32Array | null = null;
  if (IS_LITTLE_ENDIAN && (input.byteOffset + inputOffset) % 4 === 0 && inputLen >= 4) {
    inputWords = new Uint32Array(input.buffer, input.byteOffset + inputOffset, inputLen >>> 2);
  }

  for (let blockIdx = 0; blockIdx < totalBlocks; blockIdx++) {
    const isFirst = blockIdx === 0;
    const isLast = blockIdx === totalBlocks - 1;
    const blockStart = blockIdx << 6;
    const blockLen = isLast ? remainder || (inputLen > 0 ? BLOCK_LEN : 0) : BLOCK_LEN;

    // Determine flags
    let blockFlags = flags;
    if (isFirst) blockFlags |= CHUNK_START;
    if (isLast) blockFlags |= CHUNK_END | ROOT;

    // Load block
    if (isLast && remainder > 0) {
      readLittleEndianWordsPartial(input, inputOffset + blockStart, blockLen, block);
    } else if (inputLen === 0) {
      block.fill(0);
    } else if (inputWords && (blockStart >>> 2) + 16 <= inputWords.length) {
      // Fast path
      compress(
        reusableTempCv,
        0,
        inputWords,
        blockStart >>> 2,
        isLast ? out : reusableTempCv,
        0,
        isLast && fullOutput,
        chunkCounter,
        blockLen,
        blockFlags,
      );
      continue;
    } else {
      readLittleEndianWordsFull(input, inputOffset + blockStart, block);
    }

    compress(
      reusableTempCv,
      0,
      block,
      0,
      isLast ? out : reusableTempCv,
      0,
      isLast && fullOutput,
      chunkCounter,
      blockLen,
      blockFlags,
    );
  }
}

/**
 * Hash using WASM SIMD - processes 4 chunks in parallel.
 * Falls back to pure JS if SIMD fails.
 */
function hashSimd(input: Uint8Array, outputLen: number): Uint8Array {
  const mem = getSimdMemory();
  if (!mem) {
    return hashPureJS(input, outputLen);
  }

  const { view32 } = mem;
  const inputLen = input.length;
  const numChunks = Math.ceil(inputLen / CHUNK_LEN);

  // For small inputs, pure JS is faster (no transpose overhead)
  if (numChunks < 4) {
    return hashPureJS(input, outputLen);
  }

  // Try to use WASM arena buffers (zero JS heap allocation)
  // Falls back to JS buffers if arena not available
  const arena = getArenaBuffers();
  const useWasmParent = arena !== null; // Use WASM parent compress when arena available
  let stack: Uint32Array;
  let tempCvs: Uint32Array;
  let parentBlock: Uint32Array;
  let parentCv: Uint32Array;

  if (arena) {
    // Use WASM-backed arena buffers
    stack = arena.cvStack;
    tempCvs = arena.tempCvs;
    parentBlock = arena.parentBlock;
    parentCv = arena.chunkCv;
  } else {
    // Fallback to JS heap buffers - use global contiguous stack (no allocation)
    stack = HYPER_CV_STACK;
    tempCvs = reusableSimdCvs;
    parentBlock = reusableSimdParentBlock;
    parentCv = reusableSimdParentCv;
  }

  let stackLen = 0;

  // Use TypedArrays instead of JS arrays for block parameters
  const offsets = reusableOffsets;
  const counters = reusableCounters;
  const blockLens = reusableBlockLens;
  const flagsArr = reusableFlags;

  // Create Uint32Array view once for entire hash call (optimization: avoid allocation in hot loop)
  const inputWords =
    IS_LITTLE_ENDIAN && input.byteOffset % 4 === 0
      ? new Uint32Array(input.buffer, input.byteOffset, input.byteLength >>> 2)
      : null;

  // Calculate number of full chunks (1024 bytes each)
  const numFullChunks = inputLen >>> 10; // inputLen / 1024

  // Process chunks in groups of 4
  let chunkIdx = 0;
  while (chunkIdx < numChunks) {
    const groupSize = Math.min(4, numChunks - chunkIdx);

    // === BATCH FAST PATH: 4 full chunks ===
    // Use compressChunks4x for groups of exactly 4 full chunks
    // This reduces 16 WASM calls to 1 per group
    const canUseBatchPath = groupSize === 4 && chunkIdx + 4 <= numFullChunks;

    if (canUseBatchPath) {
      // Set up chunk offsets for batch transpose
      batchChunkOffsets[0] = chunkIdx * CHUNK_LEN;
      batchChunkOffsets[1] = (chunkIdx + 1) * CHUNK_LEN;
      batchChunkOffsets[2] = (chunkIdx + 2) * CHUNK_LEN;
      batchChunkOffsets[3] = (chunkIdx + 3) * CHUNK_LEN;

      // Transpose all 64 blocks (4 chunks × 16 blocks) at once
      transposeBatchToSimd(input, batchChunkOffsets, view32, inputWords);

      // Set up initial CVs (IV) in batch memory - transposed layout
      for (let w = 0; w < 8; w++) {
        const ivWord = IV[w];
        const base = BATCH_CV_BASE + w * 4;
        view32[base] = ivWord;
        view32[base + 1] = ivWord;
        view32[base + 2] = ivWord;
        view32[base + 3] = ivWord;
      }

      // Set up counters in batch memory
      view32[BATCH_COUNTER_LOW_BASE] = chunkIdx;
      view32[BATCH_COUNTER_LOW_BASE + 1] = chunkIdx + 1;
      view32[BATCH_COUNTER_LOW_BASE + 2] = chunkIdx + 2;
      view32[BATCH_COUNTER_LOW_BASE + 3] = chunkIdx + 3;

      // Set up base flags (0 - no keyed hashing)
      view32[BATCH_FLAGS_BASE_OFFSET] = 0;
      view32[BATCH_FLAGS_BASE_OFFSET + 1] = 0;
      view32[BATCH_FLAGS_BASE_OFFSET + 2] = 0;
      view32[BATCH_FLAGS_BASE_OFFSET + 3] = 0;

      // Run batched compress (16 blocks × 4 chunks in one call!)
      runCompressChunks4x();

      // Read output CVs from batch output - untranspose to tempCvs
      for (let w = 0; w < 8; w++) {
        const base = BATCH_OUTPUT_BASE + w * 4;
        tempCvs[w] = view32[base]; // chunk 0
        tempCvs[8 + w] = view32[base + 1]; // chunk 1
        tempCvs[16 + w] = view32[base + 2]; // chunk 2
        tempCvs[24 + w] = view32[base + 3]; // chunk 3
      }
    } else {
      // === STANDARD PATH: block-by-block processing ===
      // Used for partial chunks or groups < 4

      // Initialize CVs for this group to IV (flat array: 4 × 8 words)
      for (let g = 0; g < groupSize; g++) {
        const base = g * 8;
        tempCvs[base] = IV[0];
        tempCvs[base + 1] = IV[1];
        tempCvs[base + 2] = IV[2];
        tempCvs[base + 3] = IV[3];
        tempCvs[base + 4] = IV[4];
        tempCvs[base + 5] = IV[5];
        tempCvs[base + 6] = IV[6];
        tempCvs[base + 7] = IV[7];
      }

      // Process all 16 blocks of each chunk in this group
      for (let blockIdx = 0; blockIdx < 16; blockIdx++) {
        // Calculate block offsets and parameters (reuse arrays)

        for (let g = 0; g < groupSize; g++) {
          const thisChunkIdx = chunkIdx + g;
          const chunkStart = thisChunkIdx * CHUNK_LEN;
          const chunkLen = Math.min(CHUNK_LEN, inputLen - chunkStart);
          const thisBlockStart = chunkStart + blockIdx * BLOCK_LEN;

          // Determine block length for this specific block
          const blockStartInChunk = blockIdx * BLOCK_LEN;
          let thisBlockLen = BLOCK_LEN;
          if (blockStartInChunk >= chunkLen) {
            thisBlockLen = 0;
          } else if (blockStartInChunk + BLOCK_LEN > chunkLen) {
            thisBlockLen = chunkLen - blockStartInChunk;
          }

          offsets[g] = thisBlockStart;
          counters[g] = thisChunkIdx;

          // Determine flags
          let flags = 0;
          if (blockIdx === 0) flags |= CHUNK_START;
          const totalBlocksInChunk = Math.ceil(chunkLen / BLOCK_LEN) || 1;
          if (blockIdx === totalBlocksInChunk - 1) flags |= CHUNK_END;

          blockLens[g] = thisBlockLen;
          flagsArr[g] = flags;
        }

        // Check if any blocks need processing
        if (blockLens[0] === 0 && blockLens[1] === 0 && blockLens[2] === 0 && blockLens[3] === 0)
          continue;

        // Transpose blocks into SIMD memory (pass pre-created view to avoid allocation)
        transposeBlocksToSimd(input, offsets, blockLens, view32, groupSize, inputWords);

        // Set up CVs in SIMD memory
        setupSimdCvs(tempCvs, view32, groupSize);

        // Set up parameters
        setupSimdParams(view32, counters, blockLens, flagsArr, groupSize);

        // Run SIMD compress
        runCompress4x();

        // Read output CVs back
        readSimdOutputCvs(view32, simdChunkCvs, groupSize);

        // Update tempCvs - copy from simdChunkCvs (both are flat 32-word arrays)
        // simdChunkCvs layout matches tempCvs: [cv0_w0..cv0_w7, cv1_w0..cv1_w7, ...]
        // IMPORTANT: Only update CVs for chunks that had data in this block!
        // Skipping this check would corrupt CVs for partial chunks after their final block.
        for (let g = 0; g < groupSize; g++) {
          if (blockLens[g] === 0) continue; // Don't update CV for chunks with no data in this block
          const base = g * 8;
          tempCvs[base] = simdChunkCvs[base];
          tempCvs[base + 1] = simdChunkCvs[base + 1];
          tempCvs[base + 2] = simdChunkCvs[base + 2];
          tempCvs[base + 3] = simdChunkCvs[base + 3];
          tempCvs[base + 4] = simdChunkCvs[base + 4];
          tempCvs[base + 5] = simdChunkCvs[base + 5];
          tempCvs[base + 6] = simdChunkCvs[base + 6];
          tempCvs[base + 7] = simdChunkCvs[base + 7];
        }
      }
    }

    // Merge each chunk's CV into the Merkle tree
    for (let g = 0; g < groupSize; g++) {
      const thisChunkIdx = chunkIdx + g;

      // Merge completed subtrees
      let totalChunks = thisChunkIdx + 1;
      // Track newCv source - either from tempCvs or parentCv
      let newCvBase = g * 8; // Offset into tempCvs
      let newCvSrc = tempCvs;

      // Check if this is the last chunk
      const isLastChunk = thisChunkIdx === numChunks - 1;

      while ((totalChunks & 1) === 0 && stackLen > 0) {
        // Skip final merge if it would produce the root; let finalization handle it with ROOT flag
        if (stackLen === 1 && isLastChunk) {
          break;
        }
        // Pop left child
        stackLen--;
        const stackOff = stackLen * 8;
        // Copy from stack to parentBlock[0..7] (unrolled)
        copyCV8(stack, stackOff, parentBlock, 0);
        // Copy from newCv source to parentBlock[8..15] (unrolled)
        copyCV8(newCvSrc, newCvBase, parentBlock, 8);

        if (useWasmParent) {
          // WASM parent compress - data already in arena buffers
          runCompressParent();
        } else {
          compress(IV, 0, parentBlock, 0, parentCv, 0, false, 0, BLOCK_LEN, PARENT);
        }

        newCvSrc = parentCv;
        newCvBase = 0;
        totalChunks >>>= 1;
      }

      // Push to stack (unrolled)
      const pushOff = stackLen * 8;
      copyCV8(newCvSrc, newCvBase, stack, pushOff);
      stackLen++;
    }

    chunkIdx += groupSize;
  }

  // Finalize: merge remaining stack entries
  while (stackLen > 1) {
    stackLen--;
    const rightOff = stackLen * 8;
    stackLen--;
    const leftOff = stackLen * 8;
    // Copy left CV to parentBlock[0..7] and right CV to parentBlock[8..15] (unrolled)
    copyCV8(stack, leftOff, parentBlock, 0);
    copyCV8(stack, rightOff, parentBlock, 8);

    if (stackLen === 0) {
      // This is the root - use reusable output buffer
      const out = outputLen === 32 ? reusableOut8 : new Uint32Array(outputLen > 32 ? 16 : 8);
      compress(IV, 0, parentBlock, 0, out, 0, outputLen > 32, 0, BLOCK_LEN, PARENT | ROOT);

      // Return result - use pre-created view for common 32-byte case
      if (outputLen === 32 && IS_LITTLE_ENDIAN) {
        return reusableOut8View.slice();
      }
      const result = new Uint8Array(outputLen);
      if (IS_LITTLE_ENDIAN) {
        result.set(new Uint8Array(out.buffer, 0, outputLen));
      } else {
        writeLittleEndianBytesPartial(out, 0, result, 0, outputLen);
      }
      return result;
    }

    if (useWasmParent) {
      // WASM parent compress - data already in arena buffers
      runCompressParent();
    } else {
      compress(IV, 0, parentBlock, 0, parentCv, 0, false, 0, BLOCK_LEN, PARENT);
    }

    // Push to stack (unrolled)
    copyCV8(parentCv, 0, stack, stackLen * 8);
    stackLen++;
  }

  // Single entry in stack - finalize as root
  if (stackLen === 1) {
    const block = getBlockWords();
    block.fill(0);
    // Copy first 8 words from stack (unrolled)
    copyCV8(stack, 0, block, 0);

    // Use reusable output buffer
    const out = outputLen === 32 ? reusableOut8 : new Uint32Array(outputLen > 32 ? 16 : 8);
    compress(IV, 0, block, 0, out, 0, outputLen > 32, 0, BLOCK_LEN, ROOT);

    // Return result - use pre-created view for common 32-byte case
    if (outputLen === 32 && IS_LITTLE_ENDIAN) {
      return reusableOut8View.slice();
    }
    const result = new Uint8Array(outputLen);
    if (IS_LITTLE_ENDIAN) {
      result.set(new Uint8Array(out.buffer, 0, outputLen));
    } else {
      writeLittleEndianBytesPartial(out, 0, result, 0, outputLen);
    }
    return result;
  }

  // Should not reach here
  return hashPureJS(input, outputLen);
}

/**
 * Hash input data and return the result.
 * Automatically uses WASM SIMD for large inputs when available.
 *
 * @param input - Data to hash
 * @param outputLength - Number of bytes to output (default: 32)
 * @returns The hash output
 */
export function hash(input: Uint8Array, outputLength: number = OUT_LEN): Uint8Array {
  // For large inputs, use SIMD for ~1.5x performance improvement
  if (input.length >= SIMD_THRESHOLD && ensureSimdSync()) {
    return hashSimd(input, outputLength);
  }
  return hashPureJS(input, outputLength);
}

/**
 * Pre-warm SIMD initialization (call early to avoid latency later).
 */
export function warmupSimd(): boolean {
  return ensureSimdSync();
}

/**
 * Hash input data directly into a caller-provided output buffer.
 * Zero-allocation for the common 32-byte case - ideal for performance-critical code.
 *
 * @param input - Data to hash
 * @param output - Pre-allocated output buffer (must be at least outputLength bytes)
 * @param outputLength - Number of bytes to output (default: 32, max: output.length)
 */
export function hashInto(
  input: Uint8Array,
  output: Uint8Array,
  outputLength: number = OUT_LEN,
): void {
  // Validate output buffer
  if (output.length < outputLength) {
    throw new Error(`Output buffer too small: ${output.length} < ${outputLength}`);
  }

  // For large inputs, use SIMD for ~1.5x performance improvement
  if (input.length >= SIMD_THRESHOLD && ensureSimdSync()) {
    hashSimdInto(input, output, outputLength);
    return;
  }

  hashPureJSInto(input, output, outputLength);
}

/**
 * Internal: Hash using pure JS, writing directly to output buffer.
 */
function hashPureJSInto(input: Uint8Array, output: Uint8Array, outputLen: number): void {
  const inputLen = input.length;

  // Special case: empty input
  if (inputLen === 0) {
    const block = getBlockWords();
    block.fill(0);
    const out = outputLen <= 32 ? reusableOut8 : new Uint32Array(16);

    compress(IV, 0, block, 0, out, 0, outputLen > 32, 0, 0, CHUNK_START | CHUNK_END | ROOT);

    // Copy result to output
    if (IS_LITTLE_ENDIAN) {
      output.set(new Uint8Array(out.buffer, out.byteOffset, outputLen));
    } else {
      writeLittleEndianBytesPartial(out, 0, output, 0, outputLen);
    }
    return;
  }

  // Calculate number of chunks
  const numChunks = Math.ceil(inputLen / CHUNK_LEN);

  // Single chunk optimization
  if (numChunks === 1) {
    const cv = outputLen <= 32 ? reusableOut8 : new Uint32Array(16);
    hashChunkRoot(input, 0, inputLen, 0, 0, cv, outputLen > 32);

    // Copy result to output
    if (IS_LITTLE_ENDIAN) {
      output.set(new Uint8Array(cv.buffer, cv.byteOffset, outputLen));
    } else {
      writeLittleEndianBytesPartial(cv, 0, output, 0, outputLen);
    }
    return;
  }

  // Multiple chunks - delegate to hashPureJS and copy result
  const result = hashPureJS(input, outputLen);
  output.set(result);
}

/**
 * Internal: Hash using SIMD, writing directly to output buffer.
 */
function hashSimdInto(input: Uint8Array, output: Uint8Array, outputLen: number): void {
  // Delegate to hashSimd and copy result (SIMD path already optimized)
  const result = hashSimd(input, outputLen);
  output.set(result);
}
