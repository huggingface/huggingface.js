const CHUNK_CACHE_INITIAL_SIZE = 10_000;
const CHUNK_CACHE_GROW_FACTOR = 1.5;
const CHUNK_CACHE_MAX_SIZE = 1_000_000;

export class ChunkCache {
	index = 0;
	// Index >= 0 means local xorb, < 0 means remote xorb
	xorbIndices = new Int32Array(CHUNK_CACHE_INITIAL_SIZE);
	// Max 8K chunks per xorb, less than 64K uint16_t
	chunkIndices = new Uint16Array(CHUNK_CACHE_INITIAL_SIZE);
	map = new Map<string, number>(); // hash -> chunkCacheIndex. Less overhead that way, empty object is 60+B and empty array is 40+B
	hmacs = new Set<string>(); // todo : remove old hmacs

	addChunkToCache(hash: string, xorbIndex: number, chunkIndex: number, hmac: string | null): void {
		this.map.set(hash, this.index);
		if (hmac !== null) {
			this.hmacs.add(hmac);
		}

		if (this.index >= this.xorbIndices.length) {
			// todo: switch to resize() with modern browsers
			const oldXorbIndices = this.xorbIndices;
			const oldChunkIndices = this.chunkIndices;
			this.xorbIndices = new Int32Array(
				Math.min(this.xorbIndices.length * CHUNK_CACHE_GROW_FACTOR, CHUNK_CACHE_MAX_SIZE)
			);
			this.chunkIndices = new Uint16Array(
				Math.min(this.chunkIndices.length * CHUNK_CACHE_GROW_FACTOR, CHUNK_CACHE_MAX_SIZE)
			);
			this.xorbIndices.set(oldXorbIndices);
			this.chunkIndices.set(oldChunkIndices);
		}

		this.xorbIndices[this.index] = xorbIndex;
		this.chunkIndices[this.index] = chunkIndex;
		this.index = (this.index + 1) % CHUNK_CACHE_MAX_SIZE;

		while (this.map.size > CHUNK_CACHE_MAX_SIZE) {
			// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
			this.map.delete(this.map.keys().next().value!);
		}
	}

	getChunk(
		hash: string,
		/**
		 * Set to null if you only want to check against locally created chunks, or the hash is already a hmac
		 */
		hmacFunction: ((hash: string, key: string) => string) | null
	):
		| {
				xorbIndex: number;
				chunkIndex: number;
		  }
		| undefined {
		let index = this.map.get(hash);
		if (index === undefined && hmacFunction !== null) {
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
			chunkIndex: this.chunkIndices[index],
		};
	}

	removeChunkFromCache(hash: string): void {
		this.map.delete(hash);
	}
}
