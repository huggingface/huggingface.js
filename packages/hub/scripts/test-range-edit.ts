/**
 * Integration test for range-edit uploads (`CommitEditFile` with a `XetBlob` original).
 *
 * Creates a private repo, uploads a file, then edits/appends it via `commit` edit
 * operations whose `originalContent` is the `XetBlob` returned by `downloadFile`. The
 * unchanged parts of the file are not re-chunked: the CAS `/v2/file-chunk-hashes` API
 * provides partial merkle data instead. After each edit the file is re-downloaded and
 * compared byte-for-byte. The repo is deleted at the end.
 *
 * Usage: HF_TOKEN=hf_... pnpm --filter @huggingface/hub exec tsx scripts/test-range-edit.ts
 */

import { commit, createRepo, deleteRepo, downloadFile, whoAmI } from "../src";
import type { RepoDesignation } from "../src";

const accessToken = process.env.HF_TOKEN;
if (!accessToken) {
	console.error("Set HF_TOKEN to run this script");
	process.exit(1);
}

/** Deterministic pseudo-random bytes (splitmix64) */
function randomBytes(seed: bigint, length: number): Uint8Array {
	const out = new Uint8Array(length);
	const view = new DataView(out.buffer);
	let state = seed;
	let i = 0;
	for (; i + 8 <= length; i += 8) {
		state = (state + 0x9e3779b97f4a7c15n) & 0xffffffffffffffffn;
		let z = state;
		z = ((z ^ (z >> 30n)) * 0xbf58476d1ce4e5b9n) & 0xffffffffffffffffn;
		z = ((z ^ (z >> 27n)) * 0x94d049bb133111ebn) & 0xffffffffffffffffn;
		z ^= z >> 31n;
		view.setBigUint64(i, z, true);
	}
	for (; i < length; i++) {
		out[i] = i & 0xff;
	}
	return out;
}

interface FetchStats {
	fileChunkHashesCalls: number;
	xorbUploads: number;
	casDataBytesDownloaded: number;
}

function instrumentedFetch(stats: FetchStats): typeof fetch {
	return async (input, init) => {
		const url = String(typeof input === "object" && "url" in input ? input.url : input);
		const resp = await fetch(input, init);

		if (url.includes("/v2/file-chunk-hashes/")) {
			stats.fileChunkHashesCalls++;
		}
		if (url.includes("/xorbs/") && init?.method === "POST") {
			stats.xorbUploads++;
		}
		// Presigned xorb data downloads (transfer URLs) — count bytes
		if ((url.includes("transfer.xethub") || url.includes("/xorbs/")) && (!init?.method || init.method === "GET")) {
			const length = resp.headers.get("Content-Length");
			if (length) {
				stats.casDataBytesDownloaded += parseInt(length);
			}
		}
		return resp;
	};
}

async function expectContent(repo: RepoDesignation, path: string, expected: Uint8Array, label: string) {
	const blob = await downloadFile({ repo, path, accessToken });
	if (!blob) {
		throw new Error(`${label}: file ${path} not found`);
	}
	const actual = new Uint8Array(await blob.arrayBuffer());
	if (actual.length !== expected.length) {
		throw new Error(`${label}: size mismatch: ${actual.length} !== ${expected.length}`);
	}
	for (let i = 0; i < actual.length; i++) {
		if (actual[i] !== expected[i]) {
			throw new Error(`${label}: content mismatch at byte ${i}`);
		}
	}
	console.log(`✅ ${label}: content matches (${expected.length} bytes)`);
}

function splice(data: Uint8Array, start: number, end: number, insert: Uint8Array): Uint8Array {
	const out = new Uint8Array(data.length - (end - start) + insert.length);
	out.set(data.subarray(0, start), 0);
	out.set(insert, start);
	out.set(data.subarray(end), start + insert.length);
	return out;
}

async function main() {
	const user = await whoAmI({ accessToken });
	const repoName = `${user.name}/range-edit-test-${Date.now()}`;
	const repo: RepoDesignation = { type: "model", name: repoName };

	console.log(`Creating repo ${repoName}...`);
	await createRepo({ repo, accessToken, private: true });

	try {
		// 1. Initial upload: 8MB of pseudo-random data
		let expected = randomBytes(42n, 8 * 1024 * 1024);
		console.log("Uploading initial 8MB file...");
		await commit({
			repo,
			accessToken,
			title: "initial upload",
			operations: [{ operation: "addOrUpdate", path: "data.bin", content: new Blob([expected]) }],
		});
		await expectContent(repo, "data.bin", expected, "initial upload");

		// 2. Mid-file edit via range-edit path
		{
			const stats: FetchStats = { fileChunkHashesCalls: 0, xorbUploads: 0, casDataBytesDownloaded: 0 };
			const original = await downloadFile({ repo, path: "data.bin", accessToken, fetch: instrumentedFetch(stats) });
			if (!original) {
				throw new Error("original not found");
			}
			console.log(`original blob: ${original.constructor.name}, hash: ${"hash" in original ? original.hash : "n/a"}`);

			const insert = randomBytes(1000n, 1000);
			expected = splice(expected, 2_000_000, 2_001_000, insert);
			await commit({
				repo,
				accessToken,
				fetch: instrumentedFetch(stats),
				title: "mid-file edit",
				operations: [
					{
						operation: "edit",
						path: "data.bin",
						originalContent: original,
						edits: [{ content: new Blob([insert]), start: 2_000_000, end: 2_001_000 }],
					},
				],
			});
			console.log(
				`   file-chunk-hashes calls: ${stats.fileChunkHashesCalls}, xorb uploads: ${stats.xorbUploads}, CAS bytes downloaded: ${stats.casDataBytesDownloaded}`,
			);
			if (stats.fileChunkHashesCalls === 0) {
				throw new Error("Expected the range-edit path (file-chunk-hashes) to be used");
			}
			await expectContent(repo, "data.bin", expected, "mid-file edit");
		}

		// 3. Second round: edit the composed file (exercises reused terms + gapVerification)
		{
			const stats: FetchStats = { fileChunkHashesCalls: 0, xorbUploads: 0, casDataBytesDownloaded: 0 };
			const original = await downloadFile({ repo, path: "data.bin", accessToken });
			if (!original) {
				throw new Error("original not found");
			}
			const insert = randomBytes(2000n, 500);
			expected = splice(expected, 6_000_000, 6_000_100, insert);
			await commit({
				repo,
				accessToken,
				fetch: instrumentedFetch(stats),
				title: "second-round edit",
				operations: [
					{
						operation: "edit",
						path: "data.bin",
						originalContent: original,
						edits: [{ content: new Blob([insert]), start: 6_000_000, end: 6_000_100 }],
					},
				],
			});
			console.log(
				`   file-chunk-hashes calls: ${stats.fileChunkHashesCalls}, xorb uploads: ${stats.xorbUploads}, CAS bytes downloaded: ${stats.casDataBytesDownloaded}`,
			);
			await expectContent(repo, "data.bin", expected, "second-round edit");
		}

		// 4. Append
		{
			const stats: FetchStats = { fileChunkHashesCalls: 0, xorbUploads: 0, casDataBytesDownloaded: 0 };
			const original = await downloadFile({ repo, path: "data.bin", accessToken });
			if (!original) {
				throw new Error("original not found");
			}
			const appended = randomBytes(3000n, 300_000);
			const size = expected.length;
			expected = splice(expected, size, size, appended);
			await commit({
				repo,
				accessToken,
				fetch: instrumentedFetch(stats),
				title: "append",
				operations: [
					{
						operation: "edit",
						path: "data.bin",
						originalContent: original,
						edits: [{ content: new Blob([appended]), start: size, end: size }],
					},
				],
			});
			console.log(
				`   file-chunk-hashes calls: ${stats.fileChunkHashesCalls}, xorb uploads: ${stats.xorbUploads}, CAS bytes downloaded: ${stats.casDataBytesDownloaded}`,
			);
			await expectContent(repo, "data.bin", expected, "append");
		}

		// 5. Header edit (the GGUF use case: replace the first bytes)
		{
			const stats: FetchStats = { fileChunkHashesCalls: 0, xorbUploads: 0, casDataBytesDownloaded: 0 };
			const original = await downloadFile({ repo, path: "data.bin", accessToken });
			if (!original) {
				throw new Error("original not found");
			}
			const newHeader = randomBytes(4000n, 2048);
			expected = splice(expected, 0, 1024, newHeader);
			await commit({
				repo,
				accessToken,
				fetch: instrumentedFetch(stats),
				title: "header edit",
				operations: [
					{
						operation: "edit",
						path: "data.bin",
						originalContent: original,
						edits: [{ content: new Blob([newHeader]), start: 0, end: 1024 }],
					},
				],
			});
			console.log(
				`   file-chunk-hashes calls: ${stats.fileChunkHashesCalls}, xorb uploads: ${stats.xorbUploads}, CAS bytes downloaded: ${stats.casDataBytesDownloaded}`,
			);
			await expectContent(repo, "data.bin", expected, "header edit (grow)");
		}

		// 6. Cached appends: repeated appends to the same file must not call the CAS
		// metadata APIs at all (the partial merkle state is kept in memory).
		{
			const rangeEditCache = new Map();
			let logContent = randomBytes(5000n, 3 * 1024 * 1024);
			console.log("Uploading log.bin (3MB) with a range-edit cache...");
			await commit({
				repo,
				accessToken,
				rangeEditCache,
				title: "log initial",
				operations: [{ operation: "addOrUpdate", path: "log.bin", content: new Blob([logContent]) }],
			});

			for (let round = 0; round < 3; round++) {
				const stats: FetchStats = { fileChunkHashesCalls: 0, xorbUploads: 0, casDataBytesDownloaded: 0 };
				const original = await downloadFile({ repo, path: "log.bin", accessToken });
				if (!original) {
					throw new Error("log.bin not found");
				}
				const appended = randomBytes(BigInt(6000 + round), 200_000);
				const size = logContent.length;
				logContent = splice(logContent, size, size, appended);
				await commit({
					repo,
					accessToken,
					rangeEditCache,
					fetch: instrumentedFetch(stats),
					title: `append round ${round}`,
					operations: [
						{
							operation: "edit",
							path: "log.bin",
							originalContent: original,
							edits: [{ content: new Blob([appended]), start: size, end: size }],
						},
					],
				});
				console.log(
					`   round ${round}: file-chunk-hashes calls: ${stats.fileChunkHashesCalls}, xorb uploads: ${stats.xorbUploads}`,
				);
				if (stats.fileChunkHashesCalls !== 0) {
					throw new Error("Cached append should not call file-chunk-hashes");
				}
			}
			await expectContent(repo, "log.bin", logContent, "cached appends (3 rounds)");
		}

		console.log("\n🎉 All range-edit integration tests passed");
	} finally {
		console.log(`Deleting repo ${repoName}...`);
		await deleteRepo({ repo, accessToken });
	}
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
