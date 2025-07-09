JS and WASM implementations of https://github.com/huggingface/xet-core/blob/main/deduplication/src/chunking.rs

Using [AssemblyScript](https://www.assemblyscript.org/) to generate a lean WASM.

## Usage

```javascript
import { createChunker, getChunks, nextBlock, finalize, xorbHash } from '@huggingface/xetchunk-wasm';

const TARGET_CHUNK_SIZE = Math.pow(2, 12);

// Create a Uint8Array of data to search through
const data = new Uint8Array(1000000); // Example: 1MB of data
// ... fill data with your content ...

const chunks = getChunks(data, TARGET_CHUNK_SIZE);
console.log("xorbHash", xorbHasht(chunks));

// Alternative, in case your data is streaming
const chunker = createChunker(TARGET_CHUNK_SIZE);

for await (const data of source) {
  const chunks = nextBlock(chunker, data);
  console.log(chunks);
}

console.log("last chunk", finalize(chunker));
```

## Beanchmarking chunking

```shell
pnpm install
pnpm --filter xetchunk-wasm build
pnpm --filter xetchunk-wasm bench path/to/a-big-file
```