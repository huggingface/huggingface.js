# gearhash-jit

Fast [GEAR rolling hash](https://en.wikipedia.org/wiki/Rolling_hash) for content-defined chunking (CDC), using hand-written WebAssembly with native `i64` arithmetic.

Replaces the deprecated `@huggingface/gearhash-wasm` (AssemblyScript) package.

## How it works

At init time, a tiny WASM module (~120 bytes of bytecode) is generated and compiled synchronously. The inner loop uses native 64-bit integer operations (`i64.shl`, `i64.add`, `i64.and`) — single-cycle instructions that avoid the overhead of JavaScript `BigInt`.

## Usage

```typescript
import { Hasher } from 'gearhash-jit';

const mask = 0x0000d90003530000n; // CDC target mask
const hasher = new Hasher(mask);

// Scan for a chunk boundary
const pos = hasher.nextMatch(buffer);
if (pos !== -1) {
  // Boundary found at byte `pos` (1-based)
}

// Read the rolling hash state (8 LE bytes, zero-copy)
console.log(hasher.hash);

// Reset for the next chunk
hasher.resetHash();
```

### Streaming

The hash state carries over between `nextMatch` calls, so you can scan data in pieces:

```typescript
const hasher = new Hasher(mask);

for (const chunk of dataSource) {
  const pos = hasher.nextMatch(chunk);
  if (pos !== -1) {
    // Found boundary at `pos` within this chunk
    hasher.resetHash();
  }
}
```

## API

### `new Hasher(mask: bigint)`

Create a hasher with the given 64-bit CDC mask.

### `hasher.nextMatch(buf: Uint8Array): number`

Scan `buf` for the next match. Returns a 1-based byte position, or `-1` if no match.

### `hasher.hash: Uint8Array`

The current 64-bit rolling hash state as 8 little-endian bytes. Updated after every `nextMatch` call.

### `hasher.resetHash(): void`

Reset the rolling hash to zero (call when starting a new chunk).
