const CHUNK_CACHE_INITIAL_SIZE = 10_000;
const CHUNK_CACHE_GROW_FACTOR = 1.5;
const CHUNK_CACHE_MAX_SIZE = 1_000_000;

export class ChunkCache {
	index = 0;
	// Index >= 0 means local xorb, < 0 means remote xorb
	xorbIndices = new Int32Array(CHUNK_CACHE_INITIAL_SIZE);
	chunkOffsets = new Uint32Array(CHUNK_CACHE_INITIAL_SIZE);
	chunkEndOffsets = new Uint32Array(CHUNK_CACHE_INITIAL_SIZE);
	map = new Map<string, number>(); // hash -> chunkCacheIndex. Less overhead that way, empty object is 60+B and empty array is 40+B
	hmacs = new Set<string>(); // todo : remove old hmacs

	addChunkToCache(
		hash: string,
		xorbIndex: number,
		chunkOffset: number,
		chunkEndOffset: number,
		hmac: string | null
	): void {
		this.map.set(hash, this.index);
		if (hmac !== null) {
			this.hmacs.add(hmac);
		}

		if (this.index >= this.xorbIndices.length) {
			// todo: switch to resize() with modern browsers
			const oldXorbIndices = this.xorbIndices;
			const oldChunkOffsets = this.chunkOffsets;
			const oldChunkLengths = this.chunkEndOffsets;
			this.xorbIndices = new Int32Array(
				Math.min(this.xorbIndices.length * CHUNK_CACHE_GROW_FACTOR, CHUNK_CACHE_MAX_SIZE)
			);
			this.chunkOffsets = new Uint32Array(
				Math.min(this.chunkOffsets.length * CHUNK_CACHE_GROW_FACTOR, CHUNK_CACHE_MAX_SIZE)
			);
			this.chunkEndOffsets = new Uint32Array(
				Math.min(this.chunkEndOffsets.length * CHUNK_CACHE_GROW_FACTOR, CHUNK_CACHE_MAX_SIZE)
			);
			this.xorbIndices.set(oldXorbIndices);
			this.chunkOffsets.set(oldChunkOffsets);
			this.chunkEndOffsets.set(oldChunkLengths);
		}

		this.xorbIndices[this.index] = xorbIndex;
		this.chunkOffsets[this.index] = chunkOffset;
		this.chunkEndOffsets[this.index] = chunkEndOffset;
		this.index = (this.index + 1) % CHUNK_CACHE_MAX_SIZE;

		while (this.map.size > CHUNK_CACHE_MAX_SIZE) {
			// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
			this.map.delete(this.map.keys().next().value!);
		}
	}

	getChunk(
		hash: string,
		hmacFunction: (hash: string, key: string) => string
	):
		| {
				xorbIndex: number;
				offset: number;
				endOffset: number;
		  }
		| undefined {
		let index = this.map.get(hash);
		if (index === undefined) {
			for (const hmac of this.hmacs) {
				index = this.map.get(hmacFunction(hash, hmac));
				if (index !== undefined) {
					break;
				}
			}
		}
		if (index === undefined) {
			return undefined;
		}
		return {
			xorbIndex: this.xorbIndices[index],
			offset: this.chunkOffsets[index],
			endOffset: this.chunkEndOffsets[index],
		};
	}
}
