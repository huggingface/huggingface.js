import { Hasher } from "@huggingface/blake3-jit";
import type { Chunk } from "./xet-chunker.js";
import { hashToHex } from "./xet-chunker.js";

const MEAN_CHUNK_PER_NODE = 4;

const BLAKE3_NODE_KEY = new Uint8Array([
	1, 126, 197, 199, 165, 71, 41, 150, 253, 148, 102, 102, 180, 138, 2, 230, 93, 221, 83, 111, 55, 199, 109, 210, 248,
	99, 82, 230, 74, 83, 113, 63,
]);

const INDEX_OF_LAST_BYTE_OF_LAST_U64_IN_CHUNK_HASH = 3 * 8;

const nodeHasher = Hasher.newKeyed(BLAKE3_NODE_KEY);

export function xorbHash(chunks: Chunk[]): Uint8Array {
	if (chunks.length === 0) {
		return new Uint8Array(32);
	}

	let currentChunks = chunks;

	while (currentChunks.length > 1) {
		const nodes: Chunk[] = [];
		let currentIndex = 0;
		let numOfChildrenSoFar = 0;

		for (let i = 0; i < currentChunks.length; i++) {
			if (
				i === currentChunks.length - 1 ||
				numOfChildrenSoFar === 2 * MEAN_CHUNK_PER_NODE ||
				(numOfChildrenSoFar >= 2 &&
					currentChunks[i].hash[INDEX_OF_LAST_BYTE_OF_LAST_U64_IN_CHUNK_HASH] % MEAN_CHUNK_PER_NODE === 0)
			) {
				nodes.push(mergedHashOfSequence(currentChunks.slice(currentIndex, i + 1)));
				currentIndex = i + 1;
				numOfChildrenSoFar = 0;
			} else {
				numOfChildrenSoFar++;
			}
		}
		currentChunks = nodes;
	}

	return currentChunks[0].hash;
}

/**
 * Matches Rust's `merged_hash_of_sequence`: serializes each entry as
 * "{hash_hex} : {length_decimal}\n" then hashes with BLAKE3_NODE_KEY.
 */
function mergedHashOfSequence(chunks: Chunk[]): Chunk {
	let text = "";
	let totalLength = 0;
	for (const chunk of chunks) {
		text += hashToHex(chunk.hash) + " : " + chunk.length + "\n";
		totalLength += chunk.length;
	}
	const bytes = new Uint8Array(text.length);
	for (let i = 0; i < text.length; i++) {
		bytes[i] = text.charCodeAt(i);
	}
	const hash = nodeHasher.reset().update(bytes).finalize(32);
	return { hash, length: totalLength };
}
