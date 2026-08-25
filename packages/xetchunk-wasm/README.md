# @huggingface/xetchunk-wasm

Content-defined chunking and hashing for Hugging Face [Xet storage](https://huggingface.co/docs/hub/storage-regions), matching the [Rust reference implementation](https://github.com/huggingface/xet-core/blob/main/deduplication/src/chunking.rs).

Uses [`gearhash-jit`](https://www.npmjs.com/package/gearhash-jit) for fast GEAR rolling hash boundary detection and [`@huggingface/blake3-jit`](https://www.npmjs.com/package/@huggingface/blake3-jit) for BLAKE3 chunk hashing.

## Usage

```typescript
import { createChunker, nextBlock, finalize, getChunks, hashToHex, xorbHash, fileHash } from '@huggingface/xetchunk-wasm';

// One-shot: chunk all data at once
const data = new Uint8Array(1_000_000);
const chunks = getChunks(data);

console.log(`${chunks.length} chunks`);
console.log('xorb hash:', hashToHex(xorbHash(chunks)));
console.log('file hash:', hashToHex(fileHash(chunks)));

// Streaming: process data incrementally
const chunker = createChunker();

for await (const buf of source) {
  const chunks = nextBlock(chunker, buf);
  for (const chunk of chunks) {
    console.log(hashToHex(chunk.hash), chunk.length);
  }
}

const lastChunk = finalize(chunker);
```

## API

### Chunking

- **`createChunker(targetChunkSize?: number)`** — Create a chunker (default 64KB target).
- **`nextBlock(chunker, data: Uint8Array): Chunk[]`** — Feed data, get complete chunks.
- **`finalize(chunker): Chunk | null`** — Flush remaining data as a final chunk.
- **`getChunks(data: Uint8Array, targetChunkSize?: number): Chunk[]`** — One-shot convenience.

### Hash functions

All hash functions return `Uint8Array` (32 bytes). Use `hashToHex()` to convert to hex strings.

- **`xorbHash(chunks: Chunk[]): Uint8Array`** — Merkle tree hash over chunks (matches Rust `xorb_hash`).
- **`fileHash(chunks: Chunk[]): Uint8Array`** — File-level hash (matches Rust `file_hash`).
- **`hmac(hash: Uint8Array, key: Uint8Array): Uint8Array`** — BLAKE3 keyed hash (matches Rust `DataHash::hmac`).
- **`verificationHash(chunkHashes: Uint8Array[]): Uint8Array`** — Range verification hash (matches Rust `range_hash_from_chunks`).

### Partial merkle state

- **`MerkleHashSubtree`** — Compact (O(log n)) partially-aggregated merkle state over a contiguous range of chunks, matching Rust's [`MerkleHashSubtree`](https://github.com/huggingface/xet-core/blob/main/xet_core_structures/src/merklehash/merkle_hash_subtree.rs). Build with `MerkleHashSubtree.fromChunks(atStart, chunks, atEnd)`, combine adjacent ranges with `mergeInto()` / `MerkleHashSubtree.merge()`, and read the aggregated hash with `finalHash()` once the range covers the whole file (apply `hmac(hash, zeroKey)` to get the file hash). `toJSON()` / `fromJSON()` are byte-compatible with serde's human-readable serialization, ie with the `hashRanges` entries of the CAS server's `GET /v2/file-chunk-hashes` responses. Useful for editing or appending to a file without knowing all of its chunk hashes.

### Utilities

- **`hashToHex(hash: Uint8Array): string`** — Convert 32-byte hash to hex string.
- **`hexToBytes(hex: string): Uint8Array`** — Convert 64-char hex string to 32 bytes.

## Benchmarking

```shell
pnpm --filter @huggingface/xetchunk-wasm bench
# or with a specific file:
pnpm --filter @huggingface/xetchunk-wasm bench path/to/large-file
```
