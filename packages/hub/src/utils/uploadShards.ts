import { createApiError } from "../error";
import type { RepoId } from "../types/public";
import { createXorbs } from "./createXorbs";
import { sum } from "./sum";

const SHARD_MAX_SIZE = 64 * 1024 * 1024;
const SHARD_HEADER_SIZE = 48;
const SHARD_FOOTER_SIZE = 192;
const HASH_LENGTH = 32;
const XORB_FOOTER_LENGTH = 48;
const FILE_FOOTER_LENGTH = 48;
const SHARD_HEADER_VERSION = 2n;
const SHARD_FOOTER_VERSION = 1n;

const MDB_FILE_FLAG_WITH_VERIFICATION = 0x80000000; // Cannot define as 1 << 31 because it becomes a negative number
const MDB_FILE_FLAG_WITH_METADATA_EXT = 0x40000000;

const SHARD_MAGIC_TAG = new Uint8Array([
	"H".charCodeAt(0),
	"F".charCodeAt(0),
	"R".charCodeAt(0),
	"e".charCodeAt(0),
	"p".charCodeAt(0),
	"o".charCodeAt(0),
	"M".charCodeAt(0),
	"e".charCodeAt(0),
	"t".charCodeAt(0),
	"a".charCodeAt(0),
	"D".charCodeAt(0),
	"a".charCodeAt(0),
	"t".charCodeAt(0),
	"a".charCodeAt(0),
	0,
	85,
	105,
	103,
	69,
	106,
	123,
	129,
	87,
	131,
	165,
	189,
	217,
	92,
	205,
	209,
	74,
	169,
]);

writeHashToArray("0".repeat(64), SHARD_MAGIC_TAG, 0);

interface UploadShardsParams {
	accessToken: string | undefined;
	hubUrl: string;
	customFetch: typeof fetch;
	repo: RepoId;
	rev: string;
}

/**
 * Outputs the file sha256 after their xorbs/shards have been uploaded.
 */
export async function uploadShards(source: AsyncGenerator<Blob>, params: UploadShardsParams): Promise<string[]> {
	const xorbHashes: Array<string> = [];

	const fileInfoSection = new Uint8Array(Math.floor(SHARD_MAX_SIZE - SHARD_HEADER_SIZE - SHARD_FOOTER_SIZE) / 2);
	const xorbInfoSection = new Uint8Array(Math.floor(SHARD_MAX_SIZE - SHARD_HEADER_SIZE - SHARD_FOOTER_SIZE) / 2);

	const xorbView = new DataView(xorbInfoSection.buffer);
	let xorbViewOffset = 0;
	const fileInfoView = new DataView(fileInfoSection.buffer);
	let fileViewOffset = 0;
	let xorbTotalSize = 0n;
	let fileTotalSize = 0n;
	let xorbTotalUnpackedSize = 0n;
	const fileShas: Array<string> = [];

	for await (const output of createXorbs(source)) {
		switch (output.type) {
			case "xorb": {
				xorbHashes.push(output.hash);

				// todo: handle when going out of bounds
				writeHashToArray(output.hash, xorbInfoSection, xorbViewOffset);
				xorbViewOffset += HASH_LENGTH;
				xorbView.setUint32(xorbViewOffset, 0, true); // flags
				xorbViewOffset += 4;
				xorbView.setUint32(xorbViewOffset, output.chunks.length, true);
				xorbViewOffset += 4;
				const xorbUnpackedSize = sum(output.chunks.map((x) => x.length));
				xorbView.setUint32(xorbViewOffset, xorbUnpackedSize, true);
				xorbTotalUnpackedSize += BigInt(xorbUnpackedSize);
				xorbTotalSize += BigInt(output.xorb.byteLength);
				xorbViewOffset += 4;
				xorbView.setUint32(xorbViewOffset, output.xorb.byteLength, true);
				xorbViewOffset += 4;

				for (const chunk of output.chunks) {
					writeHashToArray(chunk.hash, xorbInfoSection, xorbViewOffset);
					xorbViewOffset += HASH_LENGTH;
					xorbView.setUint32(xorbViewOffset, chunk.length, true);
					xorbViewOffset += 4;
					xorbView.setUint32(xorbViewOffset, chunk.offset, true);
					xorbViewOffset += 4;
					xorbView.setBigUint64(xorbViewOffset, 0n, true); // reserved
					xorbViewOffset += 8;
				}

				await uploadXorb(output, params);
				//^ Todo: queue it and do not await it
				break;
			}
			case "file": {
				fileShas.push(output.sha256); // note: if yielding instead, maybe wait until shard is uploaded.

				// todo: handle out of bounds

				writeHashToArray(output.hash, fileInfoSection, fileViewOffset);
				fileViewOffset += HASH_LENGTH;
				// Cannot use | binary operator since it works with int32 not uint32 and one of the flags is 1 << 31
				fileInfoView.setUint32(fileViewOffset, MDB_FILE_FLAG_WITH_METADATA_EXT + MDB_FILE_FLAG_WITH_VERIFICATION, true);
				fileViewOffset += 4;
				fileInfoView.setUint32(fileViewOffset, output.representation.length, true);
				fileViewOffset += 4;
				fileInfoView.setBigUint64(fileViewOffset, 0n, true); // reserved
				fileViewOffset += 8;

				for (const repItem of output.representation) {
					writeHashToArray(xorbHashes[repItem.xorbId], fileInfoSection, fileViewOffset);
					fileViewOffset += HASH_LENGTH;
					fileInfoView.setUint32(fileViewOffset, 0, true); // Xorb flags
					fileViewOffset += 4;
					fileInfoView.setUint32(fileViewOffset, repItem.length, true);
					fileViewOffset += 4;
					fileInfoView.setUint32(fileViewOffset, repItem.offset, true);
					fileViewOffset += 4;
					fileInfoView.setUint32(fileViewOffset, repItem.endOffset, true);
					fileViewOffset += 4;
				}

				// File verification data
				for (const repItem of output.representation) {
					writeHashToArray(repItem.rangeHash, fileInfoSection, fileViewOffset);
					fileViewOffset += HASH_LENGTH;
					// reserved in file verification data
					for (let i = 0; i < 16; i++) {
						fileInfoSection[i] = 0;
					}
					fileViewOffset += 16;
				}

				// File metadata ext
				writeHashToArray(output.sha256, fileInfoSection, fileViewOffset);
				fileViewOffset += HASH_LENGTH;

				// reserved in file metadata ext
				for (let i = 0; i < 16; i++) {
					fileInfoSection[i] = 0;
				}
				fileViewOffset += 16;

				break;
			}
		}
	}

	function createShard(): Uint8Array {
		const shard = new Uint8Array(
			SHARD_HEADER_SIZE + SHARD_FOOTER_SIZE + xorbViewOffset + XORB_FOOTER_LENGTH + fileViewOffset + FILE_FOOTER_LENGTH
		);

		const shardView = new DataView(shard.buffer);
		let shardOffset = 0;

		// Header
		shard.set(SHARD_MAGIC_TAG, shardOffset);
		shardOffset += SHARD_MAGIC_TAG.length;

		shardView.setBigUint64(shardOffset, SHARD_HEADER_VERSION, true);
		shardOffset += 8;

		shardView.setBigUint64(shardOffset, BigInt(SHARD_FOOTER_SIZE), true);
		shardOffset += 8;

		// File Info Section
		shard.set(fileInfoSection, shardOffset);
		shardOffset += fileInfoSection.length;

		// File info bookend
		for (let i = 0; i < 32; i++) {
			shard[shardOffset + i] = 0xff;
		}
		shardOffset += 32;
		for (let i = 0; i < 16; i++) {
			shard[shardOffset + i] = 0;
		}
		shardOffset += 16;

		// XORB Info Section
		shard.set(xorbInfoSection, shardOffset);
		shardOffset += xorbInfoSection.length;

		// Xorb info bookend
		for (let i = 0; i < 32; i++) {
			shard[shardOffset + i] = 0xff;
		}
		shardOffset += 32;
		for (let i = 0; i < 16; i++) {
			shard[shardOffset + i] = 0;
		}
		shardOffset += 16;

		// Footer
		shardView.setBigUint64(shardOffset, SHARD_FOOTER_VERSION, true);
		shardOffset += 8;
		shardView.setBigUint64(shardOffset, BigInt(SHARD_HEADER_SIZE), true); // begging of fileinfo section
		shardOffset += 8;
		shardView.setBigUint64(shardOffset, BigInt(SHARD_FOOTER_SIZE + fileInfoSection.byteLength), true); // beginning of xorbinfo section
		shardOffset += 8;
		shardView.setBigUint64(
			shardOffset,
			BigInt(SHARD_FOOTER_SIZE + fileInfoSection.byteLength + xorbInfoSection.byteLength),
			true
		); // beginning of file lookup table
		shardOffset += 8;
		shardView.setBigUint64(shardOffset, BigInt(0), true); // num entries in file lookup table
		shardOffset += 8;

		shardView.setBigUint64(
			shardOffset,
			BigInt(SHARD_FOOTER_SIZE + fileInfoSection.byteLength + xorbInfoSection.byteLength + 8),
			true
		); // beginning of cas lookup table
		shardOffset += 8;
		shardView.setBigUint64(shardOffset, BigInt(0), true); // num entries in cas lookup table
		shardOffset += 8;

		// Footer
		const footerOffset = shardOffset;
		shardView.setBigUint64(
			shardOffset,
			BigInt(SHARD_FOOTER_SIZE + fileInfoSection.byteLength + xorbInfoSection.byteLength + 16),
			true
		); // beginning of chunk lookup table
		shardOffset += 8;
		shardView.setBigUint64(shardOffset, BigInt(0), true); // num entries in chunk lookup table
		shardOffset += 8;

		// Chunk HMAC
		for (let i = 0; i < 32; i++) {
			shardView.setUint8(shardOffset + i, 0);
		}
		shardOffset += 32;

		shardView.setBigUint64(shardOffset, BigInt(Math.floor(Date.now() / 1000)), true);
		shardOffset += 8;

		// Shard key expiration
		shardView.setBigUint64(shardOffset, 0n, true);
		shardOffset += 8;

		// Reserved space (48 bytes)
		for (let i = 0; i < 48; i++) {
			shardView.setUint8(shardOffset + i, 0);
		}
		shardOffset += 48;

		shardView.setBigUint64(shardOffset, xorbTotalSize, true);
		shardOffset += 8;

		shardView.setBigUint64(shardOffset, fileTotalSize, true);
		shardOffset += 8;

		shardView.setBigUint64(shardOffset, xorbTotalUnpackedSize, true);
		shardOffset += 8;

		shardView.setBigUint64(footerOffset, BigInt(footerOffset), true);

		xorbViewOffset = 0;
		fileViewOffset = 0;
		xorbTotalSize = 0n;
		xorbTotalUnpackedSize = 0n;
		fileTotalSize = 0n;

		return shard;
	}

	// If un-uploaded data remains, upload it
	if (xorbViewOffset || fileViewOffset) {
		await uploadShard(createShard(), params);
	}

	return fileShas;
}

// Todo: switch from hex to non-hex when WASM switches. For now consider hash is hex
function writeHashToArray(hash: string, array: Uint8Array, offset: number) {
	for (let i = 0; i < hash.length; i += 2) {
		const byte = parseInt(hash.substring(i, i + 2), 16);
		array[offset + i / 2] = byte;
	}
}

async function uploadXorb(xorb: { hash: string; xorb: Uint8Array }, params: UploadShardsParams) {
	const token = await getAccessToken(params);

	const resp = await params.customFetch(`${token.casUrl}/xorb/default/${xorb.hash}`, {
		method: "PUT",
		body: xorb.xorb,
		headers: {
			Authorization: `Bearer ${token.accessToken}`,
		},
	});

	if (!resp.ok) {
		throw await createApiError(resp);
	}
}

async function uploadShard(shard: Uint8Array, params: UploadShardsParams) {
	const token = await getAccessToken(params);

	const resp = await params.customFetch(`${token.casUrl}/v1/shard/default-merkledb`, {
		method: "PUT",
		body: shard,
		headers: {
			Authorization: `Bearer ${token.accessToken}`,
		},
	});

	if (!resp.ok) {
		throw await createApiError(resp);
	}
}

const JWT_SAFETY_PERIOD = 60_000;
const JWT_CACHE_SIZE = 1_000;

function cacheKey(params: Omit<UploadShardsParams, "customFetch">): string {
	return JSON.stringify([params.hubUrl, params.repo, params.rev, params.accessToken]);
}

const jwtPromises: Map<string, Promise<{ accessToken: string; casUrl: string }>> = new Map();
/**
 * Cache to store JWTs, to avoid making many auth requests when downloading multiple files from the same repo
 */
const jwts: Map<
	string,
	{
		accessToken: string;
		expiresAt: Date;
		casUrl: string;
	}
> = new Map();

async function getAccessToken(params: UploadShardsParams): Promise<{ accessToken: string; casUrl: string }> {
	const key = cacheKey(params);

	const jwt = jwts.get(key);

	if (jwt && jwt.expiresAt > new Date(Date.now() + JWT_SAFETY_PERIOD)) {
		return { accessToken: jwt.accessToken, casUrl: jwt.casUrl };
	}

	// If we already have a promise for this repo, return it
	const existingPromise = jwtPromises.get(key);
	if (existingPromise) {
		return existingPromise;
	}

	const promise = (async () => {
		const resp = await params.customFetch(
			`${params.hubUrl}/api/${params.repo.type}s/${params.repo.name}/xet-write-token/${params.rev}`,
			{
				method: "POST",
				headers: params.accessToken
					? {
							Authorization: `Bearer ${params.accessToken}`,
					  }
					: {},
			}
		);

		if (!resp.ok) {
			throw await createApiError(resp);
		}

		const json: { accessToken: string; casUrl: string; exp: number } = await resp.json();
		const jwt = {
			accessToken: json.accessToken,
			expiresAt: new Date(json.exp * 1000),
			casUrl: json.casUrl,
		};

		jwtPromises.delete(key);

		for (const [key, value] of jwts.entries()) {
			if (value.expiresAt < new Date(Date.now() + JWT_SAFETY_PERIOD)) {
				jwts.delete(key);
			} else {
				break;
			}
		}
		if (jwts.size >= JWT_CACHE_SIZE) {
			const keyToDelete = jwts.keys().next().value;
			if (keyToDelete) {
				jwts.delete(keyToDelete);
			}
		}
		jwts.set(key, jwt);

		return {
			accessToken: json.accessToken,
			casUrl: json.casUrl,
		};
	})();

	jwtPromises.set(key, promise);

	return promise;
}
