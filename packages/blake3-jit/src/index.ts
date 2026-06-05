/**
 * BLAKE3 - The fastest pure JavaScript implementation
 *
 * Features:
 * - All 3 modes: hash, keyed (MAC), derive_key
 * - XOF (eXtendable Output Function) support
 * - Automatic WASM SIMD acceleration for large inputs
 * - Zero dependencies
 * - Tree-shakeable exports
 *
 * @example
 * ```typescript
 * import { hash, createKeyed, createDeriveKey } from 'blake3-jit';
 *
 * // Simple hashing
 * const digest = hash(new Uint8Array([1, 2, 3]));
 *
 * // Keyed hashing (MAC)
 * const mac = createKeyed(key).update(data).finalize();
 *
 * // Key derivation
 * const derived = createDeriveKey("my context").update(material).finalize(64);
 * ```
 */

// Core exports
export { Hasher, XofReader } from "./hasher.js";
export { hash, hashInto, warmupSimd } from "./hash.js";

// Convenience imports
import { Hasher } from "./hasher.js";

/**
 * Create a new keyed hasher (MAC).
 *
 * @param key - 32-byte key
 * @returns A new Hasher configured for keyed hashing
 *
 * @example
 * ```typescript
 * const key = new Uint8Array(32); // Your 32-byte key
 * crypto.getRandomValues(key);
 *
 * const mac = createKeyed(key)
 *   .update(message)
 *   .finalize();
 * ```
 */
export function createKeyed(key: Uint8Array): Hasher {
  return Hasher.newKeyed(key);
}

/**
 * Create a new key derivation hasher.
 *
 * @param context - Context string for domain separation
 * @returns A new Hasher configured for key derivation
 *
 * @example
 * ```typescript
 * const derivedKey = createDeriveKey("my-app encryption key v1")
 *   .update(inputKeyMaterial)
 *   .finalize(32);
 * ```
 */
export function createDeriveKey(context: string): Hasher {
  return Hasher.newDeriveKey(context);
}

/**
 * Create a new regular hasher for incremental hashing.
 *
 * @returns A new Hasher
 *
 * @example
 * ```typescript
 * const hasher = createHasher();
 * hasher.update(chunk1);
 * hasher.update(chunk2);
 * const digest = hasher.finalize();
 * ```
 */
export function createHasher(): Hasher {
  return new Hasher();
}

// Import for default export
import { hash, hashInto, warmupSimd } from "./hash.js";

// Pre-warm SIMD in browser environments (non-blocking)
// This avoids initialization latency on first large hash
if (typeof globalThis !== "undefined" && typeof globalThis.document !== "undefined") {
  queueMicrotask(() => {
    warmupSimd();
  });
}

// Default export for convenience
export default {
  hash,
  hashInto,
  Hasher,
  createHasher,
  createKeyed,
  createDeriveKey,
};
