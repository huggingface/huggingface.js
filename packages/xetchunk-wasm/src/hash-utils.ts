import { Hasher } from "@huggingface/blake3-jit";
import type { Chunk } from "./xet-chunker.js";
import { xorbHash } from "./xorb-hash.js";

const ZERO_KEY = new Uint8Array(32);

const VERIFICATION_KEY = new Uint8Array([
	127, 24, 87, 214, 206, 86, 237, 102, 18, 127, 249, 19, 231, 165, 195, 243, 164, 205, 38, 213, 181, 219, 73, 230,
	65, 36, 152, 127, 40, 251, 148, 195,
]);

const fileHasher = Hasher.newKeyed(ZERO_KEY);
const verificationHasher = Hasher.newKeyed(VERIFICATION_KEY);

/**
 * file_hash = hmac(xorb_hash(chunks), zero_key)
 *
 * Matches Rust's `merklehash::file_hash` which calls
 * `file_hash_with_salt(chunks, &[0; 32])`.
 */
export function fileHash(chunks: Chunk[]): Uint8Array {
	const xorb = xorbHash(chunks);
	return fileHasher.reset().update(xorb).finalize(32);
}

/**
 * HMAC: blake3_keyed_hash(key_bytes, hash_bytes)
 *
 * Both inputs are 32-byte Uint8Arrays.
 * Matches Rust's `DataHash::hmac`.
 *
 * Uses a fresh hasher per call since the key varies.
 */
export function hmac(hash: Uint8Array, key: Uint8Array): Uint8Array {
	return Hasher.newKeyed(key).update(hash).finalize(32);
}

/**
 * Verification hash for a range of chunk hashes.
 * Concatenates all 32-byte hashes and applies blake3_keyed_hash
 * with VERIFICATION_KEY.
 *
 * Matches Rust's `chunk_verification::range_hash_from_chunks`.
 */
export function verificationHash(chunkHashes: Uint8Array[]): Uint8Array {
	const combined = new Uint8Array(chunkHashes.length * 32);
	for (let i = 0; i < chunkHashes.length; i++) {
		combined.set(chunkHashes[i], i * 32);
	}
	return verificationHasher.reset().update(combined).finalize(32);
}
