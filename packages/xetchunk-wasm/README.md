JavaScript implementation of https://github.com/huggingface/xet-core/blob/main/deduplication/src/chunking.rs

This package uses `blake3-jit` for hashing and `@huggingface/gearhash-wasm` for gearhash matching.

## Usage

```javascript
import { createChunker, getChunks, nextBlock, finalize, xorbHash } from '@huggingface/xetchunk-wasm';

const TARGET_CHUNK_SIZE = Math.pow(2, 12);

// Create a Uint8Array of data to search through
const data = new Uint8Array(1000000); // Example: 1MB of data
// ... fill data with your content ...

const chunks = getChunks(data, TARGET_CHUNK_SIZE);
console.log("xorbHash", xorbHash(chunks));

// Alternative, in case your data is streaming
const chunker = createChunker(TARGET_CHUNK_SIZE);

for await (const data of source) {
  const chunks = nextBlock(chunker, data);
  console.log(chunks);
}

console.log("last chunk", finalize(chunker));
```

## Benchmarking chunking

```shell
pnpm install
pnpm --filter xetchunk-wasm build
pnpm --filter xetchunk-wasm bench path/to/a-big-file
```