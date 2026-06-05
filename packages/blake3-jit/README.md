# @huggingface/blake3-jit

Temporary fork of [`blake3-jit`](https://github.com/Brooooooklyn/blake3-jit) by [@Brooooooklyn](https://github.com/Brooooooklyn) with performance enhancements for [Hugging Face Xet](https://huggingface.co/docs/hub/xet) content-defined chunking.

This package will be deprecated once upstream `blake3-jit` exposes these changes.

## Changes from upstream

1. **`Hasher.reset()` method** — resets the hasher to process a new message with the same key/flags, reusing all internal buffers (zero allocations per hash).

2. **Pre-allocated internal buffers** — `parentBlock`, `parentCv`, `chunkCv`, `outWords`, and `finalizeCv` are allocated once in the constructor and reused across `update`/`finalize` calls, significantly reducing GC pressure in hot loops.

3. **`ChunkState.resetTo()` method** — allows reusing `ChunkState` instances instead of allocating new ones per chunk.

4. **Removed `Uint32Array` view fast-path** in `ChunkState.update` — the byte-by-byte `readLittleEndianWordsFull` path was empirically faster and avoids `RangeError` on unaligned offsets.

5. **Dual ESM/CJS output via `tshy`** — the upstream package is ESM-only; this fork uses [`tshy`](https://github.com/isaacs/tshy) to produce both ESM and CommonJS builds, required for compatibility with Node.js CJS consumers.

These changes are also available as a patch file at [`packages/xetchunk-wasm/patches/blake3-jit.patch`](../xetchunk-wasm/patches/blake3-jit.patch) (applicable to the upstream dist bundle).

## Installation

```bash
npm install @huggingface/blake3-jit
```

## Usage

```typescript
import { hash, Hasher } from "@huggingface/blake3-jit";

// One-shot hashing
const digest = hash(new Uint8Array([1, 2, 3]));

// Incremental hashing with reset (zero-alloc reuse)
const hasher = new Hasher();
hasher.update(chunk1);
const hash1 = hasher.finalize();

hasher.reset();
hasher.update(chunk2);
const hash2 = hasher.finalize();

// Keyed hashing (MAC)
const mac = Hasher.newKeyed(key).update(message).finalize();
```

## Upstream

This is a fork of [blake3-jit](https://github.com/Brooooooklyn/blake3-jit) — a high-performance BLAKE3 implementation with runtime JIT WASM SIMD, created by [LongYinan (@Brooooooklyn)](https://github.com/Brooooooklyn).

See the upstream repository for full documentation, benchmarks, and architecture details.

## License

MIT — see [LICENSE](./LICENSE)
