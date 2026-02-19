import { createKeyed } from "blake3-jit";
import type { Chunk } from "./xet-chunker";

const MEAN_CHUNK_PER_NODE = 4;

const BLAKE3_NODE_KEY = new Uint8Array([
	1, 126, 197, 199, 165, 71, 41, 150, 253, 148, 102, 102, 180, 138, 2, 230, 93, 221, 83, 111, 55, 199, 109, 210, 248,
	99, 82, 230, 74, 83, 113, 63,
]);

const INDEX_OF_LAST_BYTE_OF_LAST_U64_IN_CHUNK_HASH = 3 * 8;
// ^ 32 bytes, 8 bytes per u64, take the first byte of the last u64 due to little endianness
// ^ Assumes that MEAN_CHUNK_PER_NODE is a power of 2 and less than 256

export function xorbHash(chunks: Chunk[]): Uint8Array {
	// Split chunks in groups of 2 - 2 * MEAN_CHUNK_PER_NODE with mean of MEAN_CHUNK_PER_NODE
	// to form a tree of nodes
	// Then recursively hash the groups

	if (chunks.length === 0) {
		// Return empty hash for empty chunks array
		return new Uint8Array(32);
	}

	let currentChunks = chunks;

	while (currentChunks.length > 1) {
		const nodes: Chunk[] = [];
		let currentIndex = 0;
		let numOfChildrenSoFar = 0;
		// ^ It's 1 less than it should be, propagating because of error in reference implementation
		for (let i = 0; i < currentChunks.length; i++) {
			if (
				i === currentChunks.length - 1 ||
				numOfChildrenSoFar === 2 * MEAN_CHUNK_PER_NODE ||
				(numOfChildrenSoFar >= 2 &&
					currentChunks[i].hash[INDEX_OF_LAST_BYTE_OF_LAST_U64_IN_CHUNK_HASH] % MEAN_CHUNK_PER_NODE === 0)
			) {
				nodes.push(nodeHash(currentChunks.slice(currentIndex, i + 1)));
				currentIndex = i + 1;
				numOfChildrenSoFar = 0;
			} else {
				numOfChildrenSoFar++;
			}
		}
		currentChunks = nodes;
	}

	return nodeHash(currentChunks).hash;
}

function nodeHash(chunks: Chunk[]): Chunk {
	const array = new Uint8Array((32 + 8) * chunks.length);
	const view = new DataView(array.buffer);
	let totalLength = 0;
	for (let i = 0; i < chunks.length; i++) {
		array.set(chunks[i].hash, i * (32 + 8));
		view.setBigUint64(i * (32 + 8) + 32, BigInt(chunks[i].length), true);
		totalLength += chunks[i].length;
	}
	const hash = createKeyed(BLAKE3_NODE_KEY).update(array).finalize(32);
	return {
		hash: hash,
		length: totalLength,
	};
}
