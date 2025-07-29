const SHARD_FOOTER_SIZE = 192;
const HASH_LENGTH = 32;
const XORB_FOOTER_LENGTH = 48;

function readHashFromArray(array: Uint8Array, offset: number): string {
	let hash = "";
	for (let i = 0; i < HASH_LENGTH; i++) {
		hash += array[offset + i].toString(16).padStart(2, "0");
	}
	return hash;
}

export interface ShardData {
	hmacKey: string;
	xorbs: Array<{
		hash: string;
		chunks: Array<{
			hash: string;
			startOffset: number;
			endOffset: number;
			length: number;
		}>;
	}>;
}

export async function parseShardData(shardBlob: Blob): Promise<ShardData> {
	const shard = new Uint8Array(await shardBlob.arrayBuffer());
	const shardView = new DataView(shard.buffer);

	// Read footer to get section offsets
	const footerStart = shard.length - SHARD_FOOTER_SIZE;
	const xorbInfoStart = Number(shardView.getBigUint64(footerStart + 16, true));
	const fileLookupStart = Number(shardView.getBigUint64(footerStart + 24, true));

	// Extract HMAC from footer (32 bytes starting at offset 112 from footer start)
	const hmacKey = readHashFromArray(shard, footerStart + 112);

	// Parse XORB Info Section
	const xorbs: ShardData["xorbs"] = [];
	let offset = xorbInfoStart;

	while (offset < fileLookupStart - XORB_FOOTER_LENGTH) {
		// Check if we've hit the xorb info bookend (32 bytes of 0xff)
		if (shard[offset] === 0xff) {
			break;
		}

		// Read xorb entry
		const xorbHash = readHashFromArray(shard, offset);
		offset += HASH_LENGTH;

		// Skip flags (4 bytes)
		offset += 4;

		const chunkCount = shardView.getUint32(offset, true);
		offset += 4;

		// Skip unpackedSize (4 bytes)
		offset += 4;

		// Skip packedSize (4 bytes)
		offset += 4;

		// Read chunks for this xorb
		const chunks: ShardData["xorbs"][0]["chunks"] = [];
		for (let i = 0; i < chunkCount; i++) {
			const chunkHash = readHashFromArray(shard, offset);
			offset += HASH_LENGTH;

			const length = shardView.getUint32(offset, true);
			offset += 4;

			const startOffset = shardView.getUint32(offset, true);
			offset += 4;

			const endOffset = startOffset + length;

			// Skip reserved 8 bytes
			offset += 8;

			chunks.push({
				hash: chunkHash,
				startOffset,
				endOffset,
				length,
			});
		}

		xorbs.push({
			hash: xorbHash,
			chunks,
		});
	}

	return {
		hmacKey,
		xorbs,
	};
}
