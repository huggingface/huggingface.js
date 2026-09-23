import { beforeAll, describe, expect, it } from "vitest";
import { formatPathTemplate, isSafeRepoPath, LeRobotDataset, parseInfo, resolveUrl } from "./index";

/**
 * Both revisions are the same SO-101 dataset: `e18e43d` predates the v2 -> v3 migration, `f641879`
 * follows it. Pinning shas keeps the expectations stable if the dataset is pushed to again.
 */
const REPO_ID = "lerobot/svla_so101_pickplace";
const REV_V21 = "e18e43de5e31997effab6abbe3810ff0e2e637d5";
const REV_V30 = "f641879e22172be7e8161d5e6c1503c2d2feb657";

const TIMEOUT = 30_000;

describe("parseInfo", () => {
	it("parses a v3.0 info file", () => {
		const info = parseInfo(
			JSON.stringify({
				codebase_version: "v3.0",
				robot_type: "so100_follower",
				fps: 30,
				total_episodes: 50,
				total_frames: 11939,
				total_tasks: 1,
				chunks_size: 1000,
				data_path: "data/chunk-{chunk_index:03d}/file-{file_index:03d}.parquet",
				video_path: "videos/{video_key}/chunk-{chunk_index:03d}/file-{file_index:03d}.mp4",
				features: {
					"observation.images.up": {
						dtype: "video",
						shape: [480, 640, 3],
						info: { "video.codec": "av1" },
					},
					"observation.state": {
						dtype: "float32",
						shape: [6],
						names: ["shoulder_pan.pos", "gripper.pos"],
					},
				},
			}),
		);

		expect(info.codebaseVersion).toBe("v3.0");
		expect(info.robotType).toBe("so100_follower");
		expect(info.fps).toBe(30);
		expect(info.totalEpisodes).toBe(50);
		expect(info.cameras).toEqual([{ key: "observation.images.up", height: 480, width: 640, codec: "av1" }]);
		expect(info.joints["observation.state"]).toEqual(["shoulder_pan.pos", "gripper.pos"]);
	});

	it("reads the codec from `video_info` as well as `info`", () => {
		const base = {
			codebase_version: "v3.0",
			fps: 50,
			total_episodes: 50,
			data_path: "data/chunk-{chunk_index:03d}/file-{file_index:03d}.parquet",
		};
		const withVideoInfo = parseInfo(
			JSON.stringify({
				...base,
				features: {
					"observation.images.cam_high": {
						dtype: "video",
						shape: [480, 640, 3],
						video_info: { "video.codec": "av1" },
					},
				},
			}),
		);
		expect(withVideoInfo.cameras[0]?.codec).toBe("av1");
	});

	it("drops an unknown robot_type", () => {
		const info = parseInfo(
			JSON.stringify({
				codebase_version: "v3.0",
				robot_type: "unknown",
				fps: 10,
				total_episodes: 206,
				data_path: "data/chunk-{chunk_index:03d}/file-{file_index:03d}.parquet",
			}),
		);
		expect(info.robotType).toBeUndefined();
	});

	it("rejects an unsupported codebase_version", () => {
		expect(() =>
			parseInfo(JSON.stringify({ codebase_version: "v1.6", fps: 30, total_episodes: 1, data_path: "x" })),
		).toThrow(/Unsupported codebase_version/);
	});

	it("rejects an LFS pointer", () => {
		expect(() => parseInfo("version https://git-lfs.github.com/spec/v1\noid sha256:abc\nsize 42\n")).toThrow(
			/not valid JSON/,
		);
	});
});

describe("formatPathTemplate", () => {
	it("zero-pads v3 indices", () => {
		expect(
			formatPathTemplate("videos/{video_key}/chunk-{chunk_index:03d}/file-{file_index:03d}.mp4", {
				video_key: "observation.images.up",
				chunk_index: 0,
				file_index: 2,
			}),
		).toBe("videos/observation.images.up/chunk-000/file-002.mp4");
	});

	it("zero-pads v2 indices", () => {
		expect(
			formatPathTemplate("videos/chunk-{episode_chunk:03d}/{video_key}/episode_{episode_index:06d}.mp4", {
				video_key: "observation.images.side",
				episode_chunk: 0,
				episode_index: 42,
			}),
		).toBe("videos/chunk-000/observation.images.side/episode_000042.mp4");
	});
});

describe("repo paths", () => {
	it("rejects paths that walk out of the repo", () => {
		expect(isSafeRepoPath("meta/info.json")).toBe(true);
		expect(isSafeRepoPath("videos/../../etc/passwd")).toBe(false);
		expect(isSafeRepoPath("/absolute")).toBe(false);
		expect(() => resolveUrl("https://huggingface.co", REPO_ID, "main", "a/../../b")).toThrow(/unsafe repo path/);
	});

	it("encodes each segment", () => {
		expect(resolveUrl("https://huggingface.co", REPO_ID, "main", "meta/info.json")).toBe(
			`https://huggingface.co/datasets/${REPO_ID}/resolve/main/meta/info.json`,
		);
	});
});

describe("LeRobotDataset (v2.1)", () => {
	const dataset = new LeRobotDataset(REPO_ID, { revision: REV_V21 });

	it(
		"reads info",
		async () => {
			const info = await dataset.info();
			expect(info.codebaseVersion).toBe("v2.1");
			expect(info.robotType).toBe("so100_follower");
			expect(info.fps).toBe(30);
			expect(info.totalEpisodes).toBe(50);
			expect(info.totalFrames).toBe(11939);
			expect(info.cameras.map((camera) => camera.key)).toEqual(["observation.images.up", "observation.images.side"]);
			expect(info.joints["observation.state"]).toEqual([
				"shoulder_pan.pos",
				"shoulder_lift.pos",
				"elbow_flex.pos",
				"wrist_flex.pos",
				"wrist_roll.pos",
				"gripper.pos",
			]);
		},
		TIMEOUT,
	);

	it(
		"reads the first episodes from a prefix of meta/episodes.jsonl",
		async () => {
			const episodes = await dataset.episodes({ limit: 3 });
			expect(episodes.map((episode) => episode.index)).toEqual([0, 1, 2]);
			expect(episodes.map((episode) => episode.length)).toEqual([303, 266, 230]);
			expect(episodes[0]?.tasks).toEqual(["pink lego brick into the transparent box"]);
			expect(episodes[0]?.durationSec).toBeCloseTo(303 / 30, 5);
			expect(episodes[0]?.videos[0]?.url).toBe(
				`https://huggingface.co/datasets/${REPO_ID}/resolve/${REV_V21}/videos/chunk-000/observation.images.up/episode_000000.mp4`,
			);
			expect(episodes[0]?.data.url).toBe(
				`https://huggingface.co/datasets/${REPO_ID}/resolve/${REV_V21}/data/chunk-000/episode_000000.parquet`,
			);
		},
		TIMEOUT,
	);

	it(
		"honours offset",
		async () => {
			const episodes = await dataset.episodes({ offset: 2, limit: 2 });
			expect(episodes.map((episode) => episode.index)).toEqual([2, 3]);
		},
		TIMEOUT,
	);
});

describe("LeRobotDataset (v3.0)", () => {
	const dataset = new LeRobotDataset(REPO_ID, { revision: REV_V30 });

	it(
		"reads info",
		async () => {
			const info = await dataset.info();
			expect(info.codebaseVersion).toBe("v3.0");
			expect(info.robotType).toBe("so100_follower");
			expect(info.totalEpisodes).toBe(50);
			expect(info.cameras[0]?.codec).toBe("av1");
			expect(info.cameras[0]?.width).toBe(640);
			expect(info.cameras[0]?.height).toBe(480);
		},
		TIMEOUT,
	);

	it(
		"reads the first episodes from the parquet index",
		async () => {
			const episodes = await dataset.episodes({ limit: 3 });
			expect(episodes.map((episode) => episode.index)).toEqual([0, 1, 2]);
			expect(episodes.map((episode) => episode.length)).toEqual([303, 266, 230]);
			expect(episodes[0]?.tasks).toEqual(["pink lego brick into the transparent box"]);
			/// v3 concatenates episodes into one file per camera, so the segment carries the offset.
			expect(episodes[0]?.durationSec).toBeCloseTo(10.1, 3);
			expect(episodes[0]?.videos[0]?.fromSec).toBe(0);
			expect(episodes[1]?.videos[0]?.fromSec).toBeGreaterThan(0);
			expect(episodes[0]?.videos[0]?.url).toBe(
				`https://huggingface.co/datasets/${REPO_ID}/resolve/${REV_V30}/videos/observation.images.up/chunk-000/file-000.mp4`,
			);
			expect(episodes[0]?.data).toEqual({
				url: `https://huggingface.co/datasets/${REPO_ID}/resolve/${REV_V30}/data/chunk-000/file-000.parquet`,
				fromRow: 0,
				toRow: 303,
			});
		},
		TIMEOUT,
	);
});

describe("v2 and v3 agree", () => {
	it(
		"yields the same episodes for the same dataset in both layouts",
		async () => {
			const [v21, v30] = await Promise.all([
				new LeRobotDataset(REPO_ID, { revision: REV_V21 }).episodes({ limit: 5 }),
				new LeRobotDataset(REPO_ID, { revision: REV_V30 }).episodes({ limit: 5 }),
			]);

			const summary = (episodes: Awaited<ReturnType<LeRobotDataset["episodes"]>>) =>
				episodes.map((episode) => ({ index: episode.index, length: episode.length, tasks: episode.tasks }));

			expect(summary(v21)).toEqual(summary(v30));
		},
		TIMEOUT,
	);
});

/** Minimal in-memory origin with Range support, so shard-walking can be exercised deterministically. */
function mockFetch(files: Record<string, Uint8Array>, seen?: string[]): typeof fetch {
	return (async (input: RequestInfo | URL, init?: RequestInit) => {
		const url = String(input);
		const path = url.split("/resolve/")[1].split("/").slice(1).join("/");
		seen?.push(path);
		const body = files[path];
		if (body === undefined) {
			return new Response(null, { status: 404 });
		}
		const range = new Headers(init?.headers).get("Range");
		const match = range?.match(/^bytes=(-?\d+)-(\d*)$/);
		if (!match) {
			return new Response(body as BodyInit, { status: 200 });
		}
		const first = Number(match[1]);
		const start = first < 0 ? Math.max(0, body.byteLength + first) : first;
		const end = match[2] === "" ? body.byteLength - 1 : Math.min(Number(match[2]), body.byteLength - 1);
		const slice = body.slice(start, end + 1);
		return new Response(slice as BodyInit, {
			status: 206,
			headers: { "content-range": `bytes ${start}-${end}/${body.byteLength}` },
		});
	}) as typeof fetch;
}

const encoder = new TextEncoder();

describe("v2 prefix reads are byte-accurate", () => {
	/// A long non-ASCII task makes the decoded string much shorter than its byte count, which used to
	/// look like end-of-file and cut the listing short.
	const task = "ranger le cube rouge dans la boîte transparente à côté de l'étagère ".repeat(24);
	const jsonl =
		Array.from({ length: 40 }, (_, index) =>
			JSON.stringify({ episode_index: index, tasks: [task], length: 100 + index }),
		).join("\n") + "\n";

	it("returns the requested count when the prefix is full of multi-byte text", async () => {
		const bytes = encoder.encode(jsonl);
		expect(bytes.byteLength).toBeGreaterThan(8 * 1024);
		expect(jsonl.length).toBeLessThan(bytes.byteLength);

		const dataset = new LeRobotDataset(REPO_ID, {
			revision: REV_V21,
			fetch: mockFetch({
				"meta/info.json": encoder.encode(
					JSON.stringify({
						codebase_version: "v2.1",
						fps: 30,
						total_episodes: 40,
						chunks_size: 1000,
						data_path: "data/chunk-{episode_chunk:03d}/episode_{episode_index:06d}.parquet",
					}),
				),
				"meta/episodes.jsonl": bytes,
			}),
		});

		const episodes = await dataset.episodes({ limit: 10 });
		expect(episodes.map((episode) => episode.index)).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
		expect(episodes[9]?.length).toBe(109);
		expect(episodes[0]?.tasks[0]).toBe(task);
	});
});

describe("v3 index sharding", () => {
	let indexShard: Uint8Array;
	let infoJson: Uint8Array;

	beforeAll(async () => {
		const base = `https://huggingface.co/datasets/${REPO_ID}/resolve/${REV_V30}`;
		const [index, info] = await Promise.all([
			fetch(`${base}/meta/episodes/chunk-000/file-000.parquet`).then((r) => r.arrayBuffer()),
			fetch(`${base}/meta/info.json`).then((r) => r.arrayBuffer()),
		]);
		indexShard = new Uint8Array(index);
		infoJson = new Uint8Array(info);
	}, TIMEOUT);

	it(
		"walks into later shards when the range spans them",
		async () => {
			const seen: string[] = [];
			/// The same 50-episode shard served twice, so the index looks like two shards.
			const dataset = new LeRobotDataset(REPO_ID, {
				revision: REV_V30,
				fetch: mockFetch(
					{
						"meta/info.json": infoJson,
						"meta/episodes/chunk-000/file-000.parquet": indexShard,
						"meta/episodes/chunk-000/file-001.parquet": indexShard,
					},
					seen,
				),
			});

			const episodes = await dataset.episodes({ offset: 48, limit: 4 });
			expect(episodes).toHaveLength(4);
			expect(seen).toContain("meta/episodes/chunk-000/file-001.parquet");
			/// Two from the tail of the first shard, two from the head of the second.
			expect(episodes.map((episode) => episode.index)).toEqual([48, 49, 0, 1]);
		},
		TIMEOUT,
	);

	it(
		"stops cleanly when the offset is past the end",
		async () => {
			const dataset = new LeRobotDataset(REPO_ID, { revision: REV_V30 });
			await expect(dataset.episodes({ offset: 10_000, limit: 5 })).resolves.toEqual([]);
		},
		TIMEOUT,
	);
});
