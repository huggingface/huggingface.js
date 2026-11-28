import { expect, it, describe } from "vitest";
import type { CommitInfo, PathInfo } from "./paths-info";
import { pathsInfo } from "../../index";

describe("pathsInfo", () => {
	it("should fetch LFS path info", async () => {
		const result: PathInfo[] = await pathsInfo({
			repo: {
				name: "google-bert/bert-base-uncased",
				type: "model",
			},
			paths: ["tf_model.h5"],
			revision: "dd4bc8b21efa05ec961e3efc4ee5e3832a3679c7",
		});

		expect(result).toHaveLength(1);

		const modelPathInfo = result[0];
		expect(modelPathInfo.path).toBe("tf_model.h5");
		expect(modelPathInfo.type).toBe("file");
		// lfs pointer, therefore lfs should be defined
		expect(modelPathInfo?.lfs).toBeDefined();
		expect(modelPathInfo?.lfs?.oid).toBe("a7a17d6d844b5de815ccab5f42cad6d24496db3850a2a43d8258221018ce87d2");
		expect(modelPathInfo?.lfs?.size).toBe(536063208);
		expect(modelPathInfo?.lfs?.pointerSize).toBe(134);

		// should not include expand info
		expect(modelPathInfo.lastCommit).toBeUndefined();
		expect(modelPathInfo.securityFileStatus).toBeUndefined();
	});

	it("expand params should fetch lastCommit", async () => {
		const result: (PathInfo & {
			lastCommit: CommitInfo;
		})[] = await pathsInfo({
			repo: {
				name: "google-bert/bert-base-uncased",
				type: "model",
			},
			paths: ["tf_model.h5"],
			revision: "dd4bc8b21efa05ec961e3efc4ee5e3832a3679c7",
			expand: true, // include
		});

		expect(result).toHaveLength(1);

		const modelPathInfo = result[0];

		// should include expand info
		expect(modelPathInfo.lastCommit).toBeDefined();

		expect(modelPathInfo.lastCommit.id).toBe("dd4bc8b21efa05ec961e3efc4ee5e3832a3679c7");
		expect(modelPathInfo.lastCommit.title).toBe("Update tf_model.h5");
		expect(modelPathInfo.lastCommit.date.getTime()).toBe(1569268124000); // 2019-09-23T19:48:44.000Z
	});

	it("non-LFS pointer should have lfs undefined", async () => {
		const result: PathInfo[] = await pathsInfo({
			repo: {
				name: "google-bert/bert-base-uncased",
				type: "model",
			},
			paths: ["config.json"],
			revision: "dd4bc8b21efa05ec961e3efc4ee5e3832a3679c7",
		});

		expect(result).toHaveLength(1);

		const modelPathInfo = result[0];
		expect(modelPathInfo.path).toBe("config.json");
		expect(modelPathInfo.lfs).toBeUndefined();
	});
});

// Offline fixtures exercise the documented custom-fetch boundary, not the live Hub.
describe("pathsInfo offline expanded metadata", () => {
	it.each([{ type: "bucket", name: "owner/bucket" } as const, "buckets/owner/bucket"])(
		"keeps bucket upload metadata without lastCommit for %j",
		async (repo) => {
			const calls: { url: string; body: unknown; method: string | undefined }[] = [];
			const uploadedAt = "2026-01-01T00:00:00Z";
			const customFetch: typeof fetch = async (url, init) => {
				calls.push({ url: String(url), body: JSON.parse(String(init?.body)), method: init?.method });
				return new Response(
					JSON.stringify([{ path: "file.txt", type: "file", size: 7, xetHash: "xet-hash", uploadedAt }]),
					{ status: 200 },
				);
			};
			const result = await pathsInfo({
				repo,
				paths: ["file.txt"],
				expand: true,
				revision: "ignored-for-buckets",
				hubUrl: "https://fixture.invalid",
				fetch: customFetch,
			});
			expect(calls).toEqual([
				{
					url: "https://fixture.invalid/api/buckets/owner/bucket/paths-info",
					method: "POST",
					body: { paths: ["file.txt"], expand: true },
				},
			]);
			expect(result[0].lastCommit).toBeUndefined();
			expect(result[0].uploadedAt).toBe(uploadedAt);
			expect(result[0].xetHash).toBe("xet-hash");
		},
	);

	it.each(["model", "dataset", "space", "kernel"] as const)("preserves expanded commit dates for %s", async (type) => {
		const date = "2019-09-23T19:48:44.000Z";
		const customFetch: typeof fetch = async () =>
			new Response(
				JSON.stringify([
					{ path: "file.txt", type: "file", size: 7, lastCommit: { id: "commit-id", title: "Commit title", date } },
				]),
				{ status: 200 },
			);
		const result = await pathsInfo({
			repo: { type, name: "owner/repo" },
			paths: ["file.txt"],
			expand: true,
			fetch: customFetch,
		});
		expect(result[0].lastCommit).toEqual({ id: "commit-id", title: "Commit title", date: new Date(date) });
		expect(result[0].lastCommit.date).toBeInstanceOf(Date);
	});
});
