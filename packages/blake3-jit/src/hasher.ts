/**
 * BLAKE3 Hasher - Incremental hashing with support for all modes
 *
 * Supports:
 * - Regular hashing
 * - Keyed hashing (MAC)
 * - Key derivation (derive_key)
 * - XOF (eXtendable Output Function) mode
 */

import { compress } from "./compress.js";
import {
  IV,
  CHUNK_START,
  CHUNK_END,
  PARENT,
  ROOT,
  KEYED_HASH,
  DERIVE_KEY_CONTEXT,
  DERIVE_KEY_MATERIAL,
  BLOCK_LEN,
  CHUNK_LEN,
  OUT_LEN,
  KEY_LEN,
  MAX_DEPTH,
} from "./constants.js";
import {
  IS_LITTLE_ENDIAN,
  readLittleEndianWordsFull,
  writeLittleEndianBytesPartial,
  encodeUTF8,
} from "./utils.js";

/**
 * Output state for XOF (eXtendable Output Function) mode.
 * Allows reading arbitrary amounts of output.
 */
export class XofReader {
  private inputCv: Uint32Array;
  private blockWords: Uint32Array;
  private counter: number;
  private blockLen: number;
  private flags: number;
  private outputBlock: Uint32Array;
  private outputBlockOffset: number;

  constructor(
    inputCv: Uint32Array,
    blockWords: Uint32Array,
    counter: number,
    blockLen: number,
    flags: number,
  ) {
    this.inputCv = inputCv;
    this.blockWords = blockWords;
    this.counter = counter;
    this.blockLen = blockLen;
    this.flags = flags | ROOT;
    this.outputBlock = new Uint32Array(16);
    this.outputBlockOffset = 64; // Forces generation on first read
  }

  /**
   * Read the next `length` bytes of output.
   */
  read(length: number): Uint8Array {
    const output = new Uint8Array(length);
    let outputOffset = 0;

    while (outputOffset < length) {
      // Generate new output block if needed
      if (this.outputBlockOffset >= 64) {
        compress(
          this.inputCv,
          0,
          this.blockWords,
          0,
          this.outputBlock,
          0,
          true, // full 64-byte output
          this.counter++,
          this.blockLen,
          this.flags,
        );
        this.outputBlockOffset = 0;
      }

      // Copy bytes from output block
      const available = 64 - this.outputBlockOffset;
      const toCopy = Math.min(available, length - outputOffset);

      // Optimized copy using writeLittleEndianBytesPartial
      const wordOffset = this.outputBlockOffset >>> 2;
      const byteWithinWord = this.outputBlockOffset & 3;

      if (byteWithinWord === 0 && toCopy >= 4) {
        // Aligned copy - can use word-at-a-time
        const fullWords = toCopy >>> 2;
        writeLittleEndianBytesPartial(
          this.outputBlock,
          wordOffset,
          output,
          outputOffset,
          fullWords << 2,
        );
        const bytesCopied = fullWords << 2;
        outputOffset += bytesCopied;
        this.outputBlockOffset += bytesCopied;
      } else {
        // Byte-by-byte for unaligned access
        for (let i = 0; i < toCopy; i++) {
          const wordIdx = (this.outputBlockOffset + i) >>> 2;
          const byteIdx = (this.outputBlockOffset + i) & 3;
          output[outputOffset + i] = (this.outputBlock[wordIdx] >>> (byteIdx << 3)) & 0xff;
        }
        outputOffset += toCopy;
        this.outputBlockOffset += toCopy;
      }
    }

    return output;
  }
}

/**
 * Chunk state for processing input data.
 * Each chunk is 1024 bytes and produces an 8-word chaining value.
 */
class ChunkState {
  chainingValue: Uint32Array;
  chunkCounter: number;
  blockWords: Uint32Array;
  blockLen: number;
  blocksCompressed: number;
  flags: number;

  constructor(keyWords: Uint32Array, chunkCounter: number, flags: number) {
    this.chainingValue = new Uint32Array(keyWords);
    this.chunkCounter = chunkCounter;
    this.blockWords = new Uint32Array(16);
    this.blockLen = 0;
    this.blocksCompressed = 0;
    this.flags = flags;
  }

  resetTo(keyWords: Uint32Array, chunkCounter: number, flags: number): void {
    this.chainingValue.set(keyWords);
    this.chunkCounter = chunkCounter;
    this.blockLen = 0;
    this.blocksCompressed = 0;
    this.flags = flags;
  }

  /**
   * Get the flags for the current block.
   */
  private startFlag(): number {
    return this.blocksCompressed === 0 ? CHUNK_START : 0;
  }

  /**
   * Update the chunk state with input data.
   * Returns the number of bytes consumed.
   */
  update(input: Uint8Array, inputOffset: number, inputLen: number): number {
    let consumed = 0;

    while (inputLen > 0) {
      // If we have a full block, compress it
      if (this.blockLen === BLOCK_LEN) {
        compress(
          this.chainingValue,
          0,
          this.blockWords,
          0,
          this.chainingValue,
          0,
          false,
          this.chunkCounter,
          BLOCK_LEN,
          this.flags | this.startFlag(),
        );
        this.blocksCompressed++;
        this.blockLen = 0;
      }

      // Fill the block buffer
      const want = BLOCK_LEN - this.blockLen;
      const take = Math.min(want, inputLen);

      if (this.blockLen === 0 && take === BLOCK_LEN) {
        readLittleEndianWordsFull(input, inputOffset, this.blockWords);
      } else {
        // Partial block - byte-by-byte into correct position
        for (let i = 0; i < take; i++) {
          const pos = this.blockLen + i;
          const wordIdx = pos >>> 2;
          const byteIdx = pos & 3;

          if (byteIdx === 0) {
            this.blockWords[wordIdx] = input[inputOffset + i];
          } else {
            this.blockWords[wordIdx] |= input[inputOffset + i] << (byteIdx << 3);
          }
        }
      }

      this.blockLen += take;
      inputOffset += take;
      inputLen -= take;
      consumed += take;
    }

    return consumed;
  }

  /**
   * Finalize this chunk and return its output.
   * Returns 8 words (chaining value) or 16 words (if root).
   */
  output(): {
    inputCv: Uint32Array;
    blockWords: Uint32Array;
    blockLen: number;
    counter: number;
    flags: number;
  } {
    // Zero-pad unused words in blockWords to avoid stale data from previous blocks
    // This is necessary when a partial block follows a full block within the same chunk
    const usedWords = (this.blockLen + 3) >>> 2; // ceil(blockLen / 4)
    for (let i = usedWords; i < 16; i++) {
      this.blockWords[i] = 0;
    }

    return {
      inputCv: this.chainingValue,
      blockWords: this.blockWords,
      blockLen: this.blockLen,
      counter: this.chunkCounter,
      flags: this.flags | this.startFlag() | CHUNK_END,
    };
  }

  /**
   * Get the number of bytes in this chunk.
   */
  len(): number {
    return this.blocksCompressed * BLOCK_LEN + this.blockLen;
  }
}

/**
 * Main BLAKE3 Hasher class.
 *
 * Usage:
 *   const hasher = new Hasher();
 *   hasher.update(data);
 *   const hash = hasher.finalize();
 *
 * Or with chaining:
 *   const hash = new Hasher().update(data).finalize();
 */
export class Hasher {
  private chunkState: ChunkState;
  private keyWords: Uint32Array;
  private cvStack: Uint32Array;
  private cvStackLen: number;
  private flags: number;
  private parentBlock: Uint32Array;
  private parentCv: Uint32Array;
  private chunkCv: Uint32Array;
  private outWords: Uint32Array;
  private finalizeCv: Uint32Array;

  /**
   * Create a new Hasher.
   *
   * @param keyWords - Initial key words (IV for regular hashing)
   * @param flags - Domain separation flags
   */
  constructor(keyWords?: Uint32Array, flags?: number) {
    this.keyWords = keyWords ? new Uint32Array(keyWords) : new Uint32Array(IV);
    this.flags = flags ?? 0;
    this.chunkState = new ChunkState(this.keyWords, 0, this.flags);
    this.cvStack = new Uint32Array(MAX_DEPTH * 8);
    this.cvStackLen = 0;
    this.parentBlock = new Uint32Array(16);
    this.parentCv = new Uint32Array(8);
    this.chunkCv = new Uint32Array(8);
    this.outWords = new Uint32Array(16);
    this.finalizeCv = new Uint32Array(8);
  }

  /**
   * Reset the hasher to process a new message with the same key/flags.
   * Reuses all internal buffers — zero allocations.
   */
  reset(): this {
    this.chunkState.resetTo(this.keyWords, 0, this.flags);
    this.cvStackLen = 0;
    return this;
  }

  /**
   * Create a new keyed hasher (MAC).
   *
   * @param key - 32-byte key
   */
  static newKeyed(key: Uint8Array): Hasher {
    if (key.length !== KEY_LEN) {
      throw new Error(`Key must be ${KEY_LEN} bytes, got ${key.length}`);
    }

    const keyWords = new Uint32Array(8);
    if (IS_LITTLE_ENDIAN) {
      const view = new Uint32Array(key.buffer, key.byteOffset, 8);
      keyWords.set(view);
    } else {
      for (let i = 0; i < 8; i++) {
        const off = i * 4;
        keyWords[i] = key[off] | (key[off + 1] << 8) | (key[off + 2] << 16) | (key[off + 3] << 24);
      }
    }

    return new Hasher(keyWords, KEYED_HASH);
  }

  /**
   * Create a new key derivation hasher.
   *
   * @param context - Context string for domain separation
   */
  static newDeriveKey(context: string): Hasher {
    // First, hash the context string with DERIVE_KEY_CONTEXT flag
    const contextBytes = encodeUTF8(context);
    const contextHasher = new Hasher(new Uint32Array(IV), DERIVE_KEY_CONTEXT);
    contextHasher.update(contextBytes);

    // Get the context key
    const contextKey = new Uint32Array(8);
    const output = contextHasher.finalizeOutput();
    compress(
      output.inputCv,
      0,
      output.blockWords,
      0,
      contextKey,
      0,
      false,
      output.counter,
      output.blockLen,
      output.flags | ROOT,
    );

    // Return a hasher initialized with the context key
    return new Hasher(contextKey, DERIVE_KEY_MATERIAL);
  }

  /**
   * Push a chaining value onto the stack.
   */
  private pushCv(cv: Uint32Array, cvOffset: number): void {
    this.cvStack.set(cv.subarray(cvOffset, cvOffset + 8), this.cvStackLen * 8);
    this.cvStackLen++;
  }

  /**
   * Pop a chaining value from the stack.
   */
  private popCv(out: Uint32Array, outOffset: number): void {
    this.cvStackLen--;
    out.set(this.cvStack.subarray(this.cvStackLen * 8, (this.cvStackLen + 1) * 8), outOffset);
  }

  /**
   * Add a chunk's chaining value and merge completed subtrees.
   */
  private addChunkCv(newCv: Uint32Array, newCvOffset: number, totalChunks: number): void {
    const parentBlock = this.parentBlock;
    const parentCv = this.parentCv;

    while ((totalChunks & 1) === 0) {
      // Pop left child, new CV is right child
      this.popCv(parentBlock, 0);
      parentBlock.set(newCv.subarray(newCvOffset, newCvOffset + 8), 8);

      compress(
        this.keyWords,
        0,
        parentBlock,
        0,
        parentCv,
        0,
        false,
        0,
        BLOCK_LEN,
        this.flags | PARENT,
      );

      newCv = parentCv;
      newCvOffset = 0;
      totalChunks >>>= 1;
    }

    this.pushCv(newCv, newCvOffset);
  }

  /**
   * Update the hasher with input data.
   *
   * @param input - Data to hash
   * @returns this (for chaining)
   */
  update(input: Uint8Array): this {
    let inputOffset = 0;
    let inputLen = input.length;

    // Fill the current chunk
    while (inputLen > 0) {
      // If current chunk is full, finalize it and start a new one
      if (this.chunkState.len() === CHUNK_LEN) {
        const output = this.chunkState.output();
        const chunkCv = this.chunkCv;

        compress(
          output.inputCv,
          0,
          output.blockWords,
          0,
          chunkCv,
          0,
          false,
          output.counter,
          output.blockLen,
          output.flags,
        );

        const totalChunks = this.chunkState.chunkCounter + 1;
        this.addChunkCv(chunkCv, 0, totalChunks);

        this.chunkState.resetTo(this.keyWords, totalChunks, this.flags);
      }

      // Fill the current chunk
      const want = CHUNK_LEN - this.chunkState.len();
      const take = Math.min(want, inputLen);

      this.chunkState.update(input, inputOffset, take);
      inputOffset += take;
      inputLen -= take;
    }

    return this;
  }

  /**
   * Get the output parameters (for XOF mode or finalization).
   */
  private finalizeOutput(): {
    inputCv: Uint32Array;
    blockWords: Uint32Array;
    blockLen: number;
    counter: number;
    flags: number;
  } {
    let output = this.chunkState.output();
    let parentBlock = this.parentBlock;
    let cv = this.finalizeCv;

    // If there are chunks on the stack, merge them
    if (this.cvStackLen > 0) {
      // First compress the current chunk
      compress(
        output.inputCv,
        0,
        output.blockWords,
        0,
        cv,
        0,
        false,
        output.counter,
        output.blockLen,
        output.flags,
      );

      // Merge with parent nodes from stack
      while (this.cvStackLen > 0) {
        this.cvStackLen--;
        parentBlock.set(this.cvStack.subarray(this.cvStackLen * 8, (this.cvStackLen + 1) * 8), 0);
        parentBlock.set(cv, 8);

        if (this.cvStackLen > 0) {
          compress(
            this.keyWords,
            0,
            parentBlock,
            0,
            cv,
            0,
            false,
            0,
            BLOCK_LEN,
            this.flags | PARENT,
          );
        } else {
          // This is the root - return output params
          return {
            inputCv: this.keyWords,
            blockWords: parentBlock,
            blockLen: BLOCK_LEN,
            counter: 0,
            flags: this.flags | PARENT,
          };
        }
      }
    }

    // Single chunk case
    return output;
  }

  /**
   * Finalize the hash and return the result.
   *
   * @param outputLength - Number of bytes to output (default: 32)
   * @returns The hash output
   */
  finalize(outputLength: number = OUT_LEN): Uint8Array {
    const output = this.finalizeOutput();
    const result = new Uint8Array(outputLength);

    if (outputLength <= 64) {
      const outWords = this.outWords;
      compress(
        output.inputCv,
        0,
        output.blockWords,
        0,
        outWords,
        0,
        outputLength > 32, // full output if > 32 bytes
        output.counter,
        output.blockLen,
        output.flags | ROOT,
      );

      if (IS_LITTLE_ENDIAN) {
        const outBytes = new Uint8Array(outWords.buffer);
        result.set(outBytes.subarray(0, outputLength));
      } else {
        writeLittleEndianBytesPartial(outWords, 0, result, 0, outputLength);
      }
    } else {
      // Multiple blocks - use XOF
      const xof = this.finalizeXof();
      const full = xof.read(outputLength);
      result.set(full);
    }

    return result;
  }

  /**
   * Finalize and return an XOF reader for arbitrary-length output.
   */
  finalizeXof(): XofReader {
    const output = this.finalizeOutput();
    return new XofReader(
      new Uint32Array(output.inputCv),
      new Uint32Array(output.blockWords),
      output.counter,
      output.blockLen,
      output.flags,
    );
  }
}
