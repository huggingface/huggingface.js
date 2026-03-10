import { describe, expect, it, vi } from "vitest";
import { SHARD_MAGIC_TAG, uploadShards } from "./uploadShards";

const MDB_FILE_FLAG_WITH_VERIFICATION = 0x80000000;
const MDB_FILE_FLAG_WITH_METADATA_EXT = 0x40000000;

const HASH_LENGTH = 32;
const FILE_BOOKEND_LENGTH = 48;
const FILE_ENTRY_BASE_SIZE = 48; // hash + flags + rep length + reserved
const REPRESENTATION_ENTRY_SIZE = 48;
const VERIFICATION_ENTRY_SIZE = 48;
const METADATA_ENTRY_SIZE = 48;

vi.mock("./createXorbs", () => ({
	createXorbs: vi.fn(
		async function* (
			source: AsyncGenerator<{ content: Blob; path: string; sha256?: string }>,
		): AsyncGenerator<
			| {
					event: "xorb";
					xorb: Uint8Array;
					hash: string;
					id: number;
					chunks: Array<{ hash: string; length: number }>;
					files: Array<{ path: string; progress: number; lastSentProgress: number }>;
			  }
			| {
					event: "file";
					path: string;
					hash: string;
					sha256?: string;
					dedupRatio: number;
					representation: Array<{
						xorbId: number | string;
						indexStart: number;
						indexEnd: number;
						length: number;
						rangeHash: string;
					}>;
			  }
		> {
			for await (const file of source) {
				yield {
					event: "xorb",
					xorb: new Uint8Array([1, 2, 3]),
					hash: "1".repeat(64),
					id: 0,
					chunks: [{ hash: "2".repeat(64), length: 3 }],
					files: [],
				};

				yield {
					event: "file",
					path: file.path,
					hash: "3".repeat(64),
					sha256: file.sha256,
					dedupRatio: 0,
					representation: [
						{
							xorbId: 0,
							indexStart: 0,
							indexEnd: 1,
							length: 3,
							rangeHash: "4".repeat(64),
						},
					],
				};
			}
		},
	),
}));

function readFileEntryInfo(shard: Uint8Array): { flags: number; fileEntryLength: number } {
	const shardView = new DataView(shard.buffer, shard.byteOffset, shard.byteLength);
	const footerSize = Number(shardView.getBigUint64(SHARD_MAGIC_TAG.length + 8, true));
	const footerStart = shard.length - footerSize;
	const fileInfoOffset = Number(shardView.getBigUint64(footerStart + 8, true));
	const xorbInfoOffset = Number(shardView.getBigUint64(footerStart + 16, true));

	const fileEntryLength = xorbInfoOffset - fileInfoOffset - FILE_BOOKEND_LENGTH;
	const flags = shardView.getUint32(fileInfoOffset + HASH_LENGTH, true);

	return { flags, fileEntryLength };
}

function toSource(sha256?: string): AsyncGenerator<{ content: Blob; path: string; sha256?: string }> {
	return (async function* () {
		yield {
			content: new Blob(["content"]),
			path: "file.bin",
			...(sha256 !== undefined ? { sha256 } : {}),
		};
	})();
}

describe("uploadShards", () => {
	it("omits metadata flag and metadata section when sha256 is missing", async () => {
		const uploadedShards: Uint8Array[] = [];
		const fetchMock: typeof fetch = vi.fn(async (input, init) => {
			const url = String(input);

			if (url.endsWith("/v1/shards")) {
				if (!(init?.body instanceof Uint8Array)) {
					throw new Error("Expected Uint8Array shard body");
				}
				uploadedShards.push(new Uint8Array(init.body));
			}

			return new Response(null, { status: 200 });
		});

		for await (const _event of uploadShards(toSource(), {
			accessToken: "test-token",
			hubUrl: "https://hub.local",
			fetch: fetchMock,
			repo: { type: "model", name: "user/repo" },
			rev: "main",
			xetParams: {
				casUrl: "https://cas.local",
				accessToken: "cas-token",
				expiresAt: new Date(Date.now() + 600_000),
				refreshWriteTokenUrl: "https://hub.local/xet-write-token",
			},
		})) {
			// consume iterator
		}

		expect(uploadedShards).toHaveLength(1);
		expect(readFileEntryInfo(uploadedShards[0])).toEqual({
			flags: MDB_FILE_FLAG_WITH_VERIFICATION,
			fileEntryLength: FILE_ENTRY_BASE_SIZE + REPRESENTATION_ENTRY_SIZE + VERIFICATION_ENTRY_SIZE,
		});
	});

	it("keeps metadata flag and metadata section when sha256 is provided", async () => {
		const uploadedShards: Uint8Array[] = [];
		const fetchMock: typeof fetch = vi.fn(async (input, init) => {
			const url = String(input);

			if (url.endsWith("/v1/shards")) {
				if (!(init?.body instanceof Uint8Array)) {
					throw new Error("Expected Uint8Array shard body");
				}
				uploadedShards.push(new Uint8Array(init.body));
			}

			return new Response(null, { status: 200 });
		});

		for await (const _event of uploadShards(toSource("5".repeat(64)), {
			accessToken: "test-token",
			hubUrl: "https://hub.local",
			fetch: fetchMock,
			repo: { type: "model", name: "user/repo" },
			rev: "main",
			xetParams: {
				casUrl: "https://cas.local",
				accessToken: "cas-token",
				expiresAt: new Date(Date.now() + 600_000),
				refreshWriteTokenUrl: "https://hub.local/xet-write-token",
			},
		})) {
			// consume iterator
		}

		expect(uploadedShards).toHaveLength(1);
		expect(readFileEntryInfo(uploadedShards[0])).toEqual({
			flags: MDB_FILE_FLAG_WITH_VERIFICATION + MDB_FILE_FLAG_WITH_METADATA_EXT,
			fileEntryLength:
				FILE_ENTRY_BASE_SIZE + REPRESENTATION_ENTRY_SIZE + VERIFICATION_ENTRY_SIZE + METADATA_ENTRY_SIZE,
		});
	});
});
