import { beforeAll, describe, expect, it } from "vitest";
import { parquetReadObjects } from "hyparquet";
import { parquetWriteBuffer } from "hyparquet-writer";
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

/**
 * Camera features from real datasets' `meta/info.json`, trimmed to the keys that decide the frame size. The
 * expected size is what ffprobe reports for the dataset's first video file.
 */
const CAMERA_CASES = [
	{
		dataset: "unitreerobotics/Z1_StackBox_Dataset",
		layout: "channel-first shape",
		key: "observation.images.cam_high",
		feature: {
			shape: [3, 480, 640],
			names: ["channels", "height", "width"],
			info: { "video.height": 480, "video.width": 640 },
		},
		width: 640,
		height: 480,
	},
	{
		dataset: "yaak-ai/L2D",
		layout: "channel-first shape, no video info",
		key: "observation.images.front_left",
		feature: { shape: [3, 1080, 1920], names: ["channel", "height", "width"] },
		width: 1920,
		height: 1080,
	},
	{
		dataset: "IPEC-COMMUNITY/bc_z_lerobot",
		layout: "shape a pixel smaller than the video",
		key: "observation.images.image",
		feature: {
			shape: [171, 213, 3],
			names: ["height", "width", "rgb"],
			info: { "video.height": 172, "video.width": 214 },
		},
		width: 214,
		height: 172,
	},
	{
		dataset: "simheo/test-branch-18",
		layout: "names that contradict the shape",
		key: "observation.images.right_cam0",
		feature: {
			shape: [720, 960, 3],
			names: ["channels", "height", "width"],
			info: { "video.height": 720, "video.width": 960 },
		},
		width: 960,
		height: 720,
	},
	{
		dataset: "lerobot/aloha_static_coffee",
		layout: "channel-last shape, no video info",
		key: "observation.images.cam_high",
		feature: { shape: [480, 640, 3], names: ["height", "width", "channel"] },
		width: 640,
		height: 480,
	},
];

describe("camera sizes", () => {
	for (const { dataset, layout, key, feature, width, height } of CAMERA_CASES) {
		it(`${dataset} ${key} (${layout})`, () => {
			const info = parseInfo(
				JSON.stringify({
					codebase_version: "v3.0",
					fps: 30,
					total_episodes: 1,
					data_path: "data/chunk-{chunk_index:03d}/file-{file_index:03d}.parquet",
					features: { [key]: { dtype: "video", ...feature } },
				}),
			);

			expect(info.cameras).toHaveLength(1);
			expect(info.cameras[0]).toMatchObject({ key, width, height });
		});
	}
});

describe("parseInfo on hostile input", () => {
	const base = {
		codebase_version: "v3.0",
		fps: 30,
		total_episodes: 1,
		data_path: "data/chunk-{chunk_index:03d}/file-{file_index:03d}.parquet",
	};

	it("drops oversized feature keys, robot types and codecs", () => {
		const info = parseInfo(
			JSON.stringify({
				...base,
				robot_type: "r".repeat(1_000),
				features: {
					["k".repeat(1_000)]: { dtype: "video", shape: [480, 640, 3] },
					["j".repeat(1_000)]: { dtype: "float32", shape: [1], names: ["a"] },
					"observation.images.up": { dtype: "video", shape: [480, 640, 3], info: { "video.codec": "c".repeat(100) } },
				},
			}),
		);
		expect(info.robotType).toBeUndefined();
		expect(info.cameras).toEqual([{ key: "observation.images.up", width: 640, height: 480, codec: undefined }]);
		expect(info.joints).toEqual({});
	});

	it("keeps only the first cameras and joint features", () => {
		const features: Record<string, unknown> = {};
		for (let i = 0; i < 100; i++) {
			features[`cam${i}`] = { dtype: "video", shape: [480, 640, 3] };
			features[`joint${i}`] = { dtype: "float32", shape: [1], names: ["a"] };
		}
		const info = parseInfo(JSON.stringify({ ...base, features }));
		expect(info.cameras.map((camera) => camera.key)).toEqual(Array.from({ length: 32 }, (_, i) => `cam${i}`));
		expect(Object.keys(info.joints)).toEqual(Array.from({ length: 64 }, (_, i) => `joint${i}`));
	});

	it("drops joint names that are too many or too long", () => {
		const names = (list: string[]) => ({ dtype: "float32", shape: [list.length], names: list });
		const info = parseInfo(
			JSON.stringify({
				...base,
				features: {
					many: names(Array.from({ length: 257 }, (_, i) => `j${i}`)),
					long: names(["a", "n".repeat(201)]),
					nested: { dtype: "float32", shape: [257], names: { motors: Array.from({ length: 257 }, (_, i) => `j${i}`) } },
					ok: names(Array.from({ length: 256 }, (_, i) => `j${i}`)),
				},
			}),
		);
		expect(Object.keys(info.joints)).toEqual(["ok"]);
	});

	it("bounds path templates", () => {
		const long = `videos/${"a".repeat(1_000)}.mp4`;
		expect(() => parseInfo(JSON.stringify({ ...base, data_path: long }))).toThrow(/data_path/);
		expect(parseInfo(JSON.stringify({ ...base, video_path: long })).videoPath).toBeUndefined();
	});

	it("falls back to the default chunk size unless it is a positive integer", () => {
		for (const chunks_size of [0, -1, 0.5, 1e300]) {
			expect(parseInfo(JSON.stringify({ ...base, chunks_size })).chunksSize).toBe(1_000);
		}
		expect(parseInfo(JSON.stringify({ ...base, chunks_size: 500 })).chunksSize).toBe(500);
	});

	it("keeps a `__proto__` feature key as plain data", () => {
		const info = parseInfo(
			JSON.stringify({ ...base, features: JSON.parse('{"__proto__": {"dtype": "float32", "names": ["a"]}}') }),
		);
		expect(Object.getPrototypeOf(info.joints)).toBe(Object.prototype);
		expect(Object.keys(info.joints)).toEqual(["__proto__"]);
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

	it("refuses a template that walks out of the repo, directly or through a key", () => {
		expect(() => formatPathTemplate("../../api/whoami-v2", {})).toThrow(/unsafe repo path/);
		expect(() => formatPathTemplate("/etc/passwd", {})).toThrow(/unsafe repo path/);
		expect(() => formatPathTemplate("videos/{video_key}.mp4", { video_key: "../../settings" })).toThrow(
			/unsafe repo path/,
		);
	});

	it("bounds the formatted path, not only the template", () => {
		/// 990 characters of template that would otherwise expand to megabytes
		expect(() => formatPathTemplate("{video_key}".repeat(90), { video_key: "k".repeat(40_000) })).toThrow(/too long/);
		expect(() => formatPathTemplate(`videos/${"a".repeat(1_100)}.mp4`, {})).toThrow(/too long/);
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
			expect(episodes[0]?.data?.url).toBe(
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

	it(
		"reads an episode's frames from its own parquet file",
		async () => {
			const [episode] = await dataset.episodes({ limit: 1 });
			const frames = await dataset.frames(episode);
			expect(frames?.length).toBe(episode.length);
			/// One series per motor, each as long as the episode.
			expect(frames?.series["observation.state"]).toHaveLength(6);
			expect(frames?.series["observation.state"][0]).toHaveLength(episode.length);
			expect(frames?.series["action"]).toHaveLength(6);
			expect(frames?.names["observation.state"]?.[0]).toBe("shoulder_pan.pos");
			expect(frames?.timestamps[0]).toBeCloseTo(0, 5);
			expect(frames?.timestamps[1]).toBeCloseTo(1 / 30, 3);
			/// Frame columns are scalars, so they are not series.
			expect(frames?.series["timestamp"]).toBeUndefined();
			expect(frames?.series["frame_index"]).toBeUndefined();
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

	it(
		"locates rows inside the data file when the page starts mid-file",
		async () => {
			const [episode] = await dataset.episodes({ offset: 1, limit: 1 });
			expect(episode?.data).toEqual({
				url: `https://huggingface.co/datasets/${REPO_ID}/resolve/${REV_V30}/data/chunk-000/file-000.parquet`,
				fromRow: 303,
				toRow: 303 + 266,
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

	it(
		"reads an episode's frames from its slice of a shared parquet file",
		async () => {
			const dataset = new LeRobotDataset(REPO_ID, { revision: REV_V30 });
			const episodes = await dataset.episodes({ offset: 1, limit: 1 });
			const [episode] = episodes;
			/// Episode 1 starts partway into the file, so this also covers the row offset.
			expect(episode.data?.fromRow).toBeGreaterThan(0);

			const frames = await dataset.frames(episode);
			expect(frames?.length).toBe(episode.length);
			expect(frames?.series["observation.state"][0]).toHaveLength(episode.length);
			expect(frames?.names["observation.state"]).toHaveLength(6);
			/// Timestamps restart at zero for each episode rather than continuing the file's clock.
			expect(frames?.timestamps[0]).toBeCloseTo(0, 5);
		},
		TIMEOUT,
	);

	it(
		"looks an episode up by index",
		async () => {
			for (const revision of [REV_V21, REV_V30]) {
				const dataset = new LeRobotDataset(REPO_ID, { revision });
				const [expected] = await dataset.episodes({ offset: 1, limit: 1 });
				expect(await dataset.episode(1)).toEqual(expected);
				expect(await dataset.episode(50)).toBeUndefined();
			}
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
		/// `bytes=-65536` is a suffix range: the last 65536 bytes.
		const match = range?.match(/^bytes=(-?\d+)-?(\d*)$/);
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

function parquet(rows: Record<string, number>[], { statistics = true } = {}): Uint8Array {
	return new Uint8Array(
		parquetWriteBuffer({
			statistics,
			columnData: Object.keys(rows[0]).map((name) => ({
				name,
				type: "INT64" as const,
				data: rows.map((row) => BigInt(row[name])),
			})),
		}),
	);
}

describe("frames columns", () => {
	const files = {
		"meta/info.json": encoder.encode(
			JSON.stringify({
				codebase_version: "v3.0",
				fps: 10,
				total_episodes: 1,
				data_path: "data/chunk-{chunk_index:03d}/file-{file_index:03d}.parquet",
			}),
		),
		"meta/episodes/chunk-000/file-000.parquet": parquet([
			{
				episode_index: 0,
				length: 3,
				"data/chunk_index": 0,
				"data/file_index": 0,
				dataset_from_index: 0,
				dataset_to_index: 3,
			},
		]),
		"data/chunk-000/file-000.parquet": new Uint8Array(
			parquetWriteBuffer({
				columnData: [
					{ name: "index", type: "INT64", data: [0n, 1n, 2n] },
					{ name: "frame_index", type: "INT64", data: [0n, 1n, 2n] },
					{ name: "episode_index", type: "INT64", data: [0n, 0n, 0n] },
					{ name: "task_index", type: "INT64", data: [0n, 0n, 0n] },
					{ name: "timestamp", type: "DOUBLE", data: [0, 0.1, 0.2] },
					{ name: "next.reward", type: "DOUBLE", data: [0, 0.5, 1] },
					{ name: "next.success", type: "BOOLEAN", data: [false, false, true] },
				],
			}),
		),
	};

	it("returns scalar and boolean columns as single series, without the bookkeeping ones", async () => {
		const dataset = new LeRobotDataset(REPO_ID, { fetch: mockFetch(files) });
		const [episode] = await dataset.episodes({ limit: 1 });
		const frames = await dataset.frames(episode);
		expect(frames?.timestamps).toEqual([0, 0.1, 0.2]);
		expect(frames?.series).toEqual({
			"next.reward": [[0, 0.5, 1]],
			"next.success": [[0, 0, 1]],
		});
	});
});

describe("episode count and repeated indexes", () => {
	const metadata = (index: number, from: number) => ({
		episode_index: index,
		length: 2,
		"data/chunk_index": 0,
		"data/file_index": 0,
		dataset_from_index: from,
		dataset_to_index: from + 2,
	});
	const info = (totalEpisodes: number) =>
		encoder.encode(
			JSON.stringify({
				codebase_version: "v3.0",
				fps: 30,
				total_episodes: totalEpisodes,
				data_path: "data/chunk-{chunk_index:03d}/file-{file_index:03d}.parquet",
			}),
		);
	const indexFile = (chunk: number, file: number) =>
		`meta/episodes/chunk-${String(chunk).padStart(3, "0")}/file-${String(file).padStart(3, "0")}.parquet`;

	it("stops at info.json's episode count, before a stale index file", async () => {
		/// Re-uploaded with 2 episodes over an older, larger dataset: the old second index file remains.
		const files = {
			"meta/info.json": info(2),
			[indexFile(0, 0)]: parquet([metadata(0, 0), metadata(1, 2)]),
			[indexFile(0, 1)]: parquet([metadata(0, 0), metadata(1, 2), metadata(2, 4)]),
		};
		const seen: string[] = [];
		const dataset = new LeRobotDataset(REPO_ID, { fetch: mockFetch(files, seen) });
		const episodes = await dataset.episodes({ limit: 10 });
		expect(episodes.map((episode) => episode.index)).toEqual([0, 1]);
		expect(seen).not.toContain(indexFile(0, 1));
		expect(await dataset.episodes({ offset: 2, limit: 10 })).toEqual([]);
	});

	it("keeps the first row of an index repeated within an index file", async () => {
		const files = {
			"meta/info.json": info(6),
			[indexFile(0, 0)]: parquet([0, 1, 2, 0, 1, 2].map((index, row) => metadata(index, row * 2))),
		};
		const dataset = new LeRobotDataset(REPO_ID, { fetch: mockFetch(files) });
		const episodes = await dataset.episodes({ limit: 6 });
		expect(episodes.map((episode) => episode.index)).toEqual([0, 1, 2]);
		/// The first occurrence, not a later one.
		expect(episodes.map((episode) => episode.data?.fromRow)).toEqual([0, 2, 4]);
	});

	it("changes nothing for a well-formed dataset", async () => {
		const files = {
			"meta/info.json": info(3),
			[indexFile(0, 0)]: parquet([0, 1, 2].map((index) => metadata(index, index * 2))),
		};
		const dataset = new LeRobotDataset(REPO_ID, { fetch: mockFetch(files) });
		expect((await dataset.episodes({ limit: 10 })).map((episode) => episode.index)).toEqual([0, 1, 2]);
		expect((await dataset.episodes({ offset: 1, limit: 1 })).map((episode) => episode.index)).toEqual([1]);
	});
});

describe("v3 data row offsets", () => {
	const metadata = (index: number, chunk: number, file: number, from: number, to: number) => ({
		episode_index: index,
		length: to - from,
		"data/chunk_index": chunk,
		"data/file_index": file,
		dataset_from_index: from,
		dataset_to_index: to,
	});
	const dataPath = (chunk: number, file: number) =>
		`data/chunk-${String(chunk).padStart(3, "0")}/file-${String(file).padStart(3, "0")}.parquet`;
	const files = {
		"meta/info.json": encoder.encode(
			JSON.stringify({
				codebase_version: "v3.0",
				fps: 30,
				total_episodes: 4,
				data_path: "data/chunk-{chunk_index:03d}/file-{file_index:03d}.parquet",
			}),
		),
		"meta/episodes/chunk-000/file-000.parquet": parquet([metadata(0, 0, 0, 0, 3), metadata(1, 0, 1, 3, 5)]),
		"meta/episodes/chunk-000/file-001.parquet": parquet([metadata(2, 0, 1, 5, 8), metadata(3, 1, 0, 8, 10)]),
		[dataPath(0, 0)]: parquet([0, 1, 2].map((index) => ({ index, episode_index: 0 }))),
		[dataPath(0, 1)]: parquet([3, 4, 5, 6, 7].map((index) => ({ index, episode_index: index < 5 ? 1 : 2 }))),
		[dataPath(1, 0)]: parquet([8, 9].map((index) => ({ index, episode_index: 3 }))),
	};

	it("returns usable file-relative ranges across files and chunks", async () => {
		const seen: string[] = [];
		const dataset = new LeRobotDataset(REPO_ID, { fetch: mockFetch(files, seen) });
		const episodes = await dataset.episodes({ limit: 4 });
		expect(episodes.map(({ data }) => [data?.fromRow, data?.toRow])).toEqual([
			[0, 3],
			[0, 2],
			[2, 5],
			[0, 2],
		]);
		for (const { data, length, index } of episodes) {
			if (data === undefined) {
				throw new Error(`episode ${index} has no data range`);
			}
			const path = data.url.split("/resolve/main/")[1];
			const rows = await parquetReadObjects({
				file: files[path].slice().buffer as ArrayBuffer,
				rowStart: data.fromRow,
				rowEnd: data.toRow,
			});
			expect(rows).toHaveLength(length);
			expect(rows.every((row) => Number(row.episode_index) === index)).toBe(true);
		}
		/// Every file starts on this page, so its first episode's metadata is enough.
		expect(seen.filter((path) => path.startsWith("data/"))).toEqual([]);
	});

	it("finds the file start even when earlier episodes and index shards are skipped", async () => {
		const seen: string[] = [];
		const dataset = new LeRobotDataset(REPO_ID, { fetch: mockFetch(files, seen) });
		const [episode, next] = await dataset.episodes({ offset: 2, limit: 2 });
		expect(episode.index).toBe(2);
		expect(episode.data).toEqual({
			url: dataset.fileUrl(dataPath(0, 1)),
			fromRow: 2,
			toRow: 5,
		});
		expect(next.data).toEqual({ url: dataset.fileUrl(dataPath(1, 0)), fromRow: 0, toRow: 2 });
		/// Only the file whose first episode is off the page is opened.
		expect(seen.filter((path) => path.startsWith("data/"))).toEqual([dataPath(0, 1)]);
	});

	it("falls back to reading the index column when the footer has no statistics", async () => {
		const withoutStatistics = {
			...files,
			[dataPath(0, 1)]: parquet(
				[3, 4, 5, 6, 7].map((index) => ({ index, episode_index: index < 5 ? 1 : 2 })),
				{ statistics: false },
			),
		};
		const dataset = new LeRobotDataset(REPO_ID, { fetch: mockFetch(withoutStatistics) });
		const [episode] = await dataset.episodes({ offset: 2, limit: 1 });
		expect(episode.data).toEqual({ url: dataset.fileUrl(dataPath(0, 1)), fromRow: 2, toRow: 5 });
	});

	it("drops only the row range when a data file cannot be read", async () => {
		const withoutFile: Record<string, Uint8Array> = { ...files };
		delete withoutFile[dataPath(0, 1)];
		const dataset = new LeRobotDataset(REPO_ID, { fetch: mockFetch(withoutFile) });
		const episodes = await dataset.episodes({ offset: 2, limit: 2 });
		expect(episodes.map((episode) => episode.index)).toEqual([2, 3]);
		expect(episodes[0].data).toBeUndefined();
		expect(episodes[1].data).toEqual({ url: dataset.fileUrl(dataPath(1, 0)), fromRow: 0, toRow: 2 });
	});

	it("drops the row range when metadata points before the start of the data file", async () => {
		const shifted = {
			...files,
			[dataPath(0, 1)]: parquet([6, 7].map((index) => ({ index, episode_index: 2 }))),
		};
		const dataset = new LeRobotDataset(REPO_ID, { fetch: mockFetch(shifted) });
		const [episode] = await dataset.episodes({ offset: 2, limit: 1 });
		expect(episode.index).toBe(2);
		expect(episode.data).toBeUndefined();
	});
});

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

describe("v3 index requests", () => {
	const indexPath = "meta/episodes/chunk-000/file-000.parquet";
	const info = (totalEpisodes: number) =>
		encoder.encode(
			JSON.stringify({
				codebase_version: "v3.0",
				fps: 30,
				total_episodes: totalEpisodes,
				data_path: "data/chunk-{chunk_index:03d}/file-{file_index:03d}.parquet",
			}),
		);
	const index = (rows: number, options: { rowGroupSize?: number; padding?: number; firstIndex?: number }) =>
		new Uint8Array(
			parquetWriteBuffer({
				rowGroupSize: options.rowGroupSize,
				columnData: [
					...Object.entries({
						episode_index: (row: number) => row + (options.firstIndex ?? 0),
						length: () => 10,
						dataset_from_index: (row: number) => row * 10,
						dataset_to_index: (row: number) => row * 10 + 10,
					}).map(([name, value]) => ({
						name,
						type: "INT64" as const,
						data: Array.from({ length: rows }, (_, row) => BigInt(value(row))),
					})),
					{
						name: "stats/observation.state/mean",
						type: "STRING" as const,
						data: Array.from({ length: rows }, (_, row) => String(row).padEnd(options.padding ?? 1, "x")),
						codec: "UNCOMPRESSED" as const,
						encoding: "PLAIN" as const,
					},
				],
			}),
		);
	const smallIndex = index(40, { padding: 5_000 });
	/// One row per row group makes the footer, not the data, most of the file.
	const largeFooterIndex = index(3_000, { rowGroupSize: 1 });

	it("reads a small index in one request", async () => {
		expect(smallIndex.byteLength).toBeGreaterThan(64 * 1024);
		expect(smallIndex.byteLength).toBeLessThan(512 * 1024);
		const seen: string[] = [];
		const dataset = new LeRobotDataset(REPO_ID, {
			fetch: mockFetch({ "meta/info.json": info(40), [indexPath]: smallIndex }, seen),
		});

		const episodes = await dataset.episodes({ limit: 3 });
		expect(episodes.map((episode) => episode.index)).toEqual([0, 1, 2]);
		expect(seen.filter((path) => path === indexPath)).toHaveLength(1);
	});

	it("fetches a footer larger than the tail once", async () => {
		const footerLength = new DataView(largeFooterIndex.buffer, largeFooterIndex.byteLength - 8, 4).getUint32(0, true);
		expect(footerLength).toBeGreaterThan(512 * 1024);
		const seen: string[] = [];
		const dataset = new LeRobotDataset(REPO_ID, {
			fetch: mockFetch({ "meta/info.json": info(3_000), [indexPath]: largeFooterIndex }, seen),
		});

		const [episode] = await dataset.episodes({ limit: 1 });
		expect(episode.index).toBe(0);
		/// The tail, the rest of the footer, then the one row group.
		expect(seen.filter((path) => path === indexPath)).toHaveLength(3);
	});

	it("still reads when the server ignores Range", async () => {
		const serve = mockFetch({ "meta/info.json": info(40), [indexPath]: smallIndex });
		/// Dropping the headers drops Range, so every response is the whole file with a 200.
		const dataset = new LeRobotDataset(REPO_ID, {
			fetch: ((input: RequestInfo | URL) => serve(input)) as typeof fetch,
		});

		const episodes = await dataset.episodes({ limit: 3 });
		expect(episodes.map((episode) => episode.index)).toEqual([0, 1, 2]);
	});

	it("looks an episode up by index with the requests of a read by position", async () => {
		/// Numbered from 0, then from 10: either way the row group statistics point at row 25.
		for (const firstIndex of [0, 10]) {
			const rowGroups = index(40, { rowGroupSize: 10, padding: 30_000, firstIndex });
			expect(rowGroups.byteLength).toBeGreaterThan(2 * 512 * 1024);
			const serve = mockFetch({ "meta/info.json": info(40), [indexPath]: rowGroups });
			const logged = (log: string[]) =>
				(async (input: RequestInfo | URL, init?: RequestInit) => {
					log.push(`${String(input).split("/resolve/main/")[1]} ${new Headers(init?.headers).get("Range")}`);
					return serve(input, init);
				}) as typeof fetch;
			const positional: string[] = [];
			const byIndex: string[] = [];

			const [expected] = await new LeRobotDataset(REPO_ID, { fetch: logged(positional) }).episodes({
				offset: 25,
				limit: 1,
			});
			const dataset = new LeRobotDataset(REPO_ID, { fetch: logged(byIndex) });
			expect(await dataset.episode(firstIndex + 25)).toEqual(expected);
			expect(byIndex).toEqual(positional);
			/// The tail, then the columns of the row group holding row 25.
			expect(positional.filter((request) => request.startsWith(indexPath))).toHaveLength(2);

			byIndex.length = 0;
			if (firstIndex > 0) {
				/// The footer alone shows that no row holds an index below the first.
				expect(await dataset.episode(firstIndex - 1)).toBeUndefined();
				expect(byIndex).toHaveLength(1);
			}
		}
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
			/// The same 50-episode shard served twice, so the index looks like two shards; info.json is told
			/// there are 100 episodes to match, since reads stop at its count.
			const twoShardInfo = encoder.encode(
				JSON.stringify({ ...JSON.parse(new TextDecoder().decode(infoJson)), total_episodes: 100 }),
			);
			const dataset = new LeRobotDataset(REPO_ID, {
				revision: REV_V30,
				fetch: mockFetch(
					{
						"meta/info.json": twoShardInfo,
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

describe("v3 index walk", () => {
	const info = (totalEpisodes: number, chunksSize?: number) =>
		encoder.encode(
			JSON.stringify({
				codebase_version: "v3.0",
				fps: 30,
				total_episodes: totalEpisodes,
				chunks_size: chunksSize,
				data_path: "data/chunk-{chunk_index:03d}/file-{file_index:03d}.parquet",
			}),
		);
	const indexFile = (chunk: number, file: number) =>
		`meta/episodes/chunk-${String(chunk).padStart(3, "0")}/file-${String(file).padStart(3, "0")}.parquet`;
	const shard = (from: number, rows: number) =>
		parquet(Array.from({ length: rows }, (_, row) => ({ episode_index: from + row, length: 1 })));
	const indexRequests = (seen: string[]) => seen.filter((path) => path.startsWith("meta/episodes/"));
	/// Every index path answers with `index`, as a misbehaving server or a crafted dataset could.
	const everyIndexPath = (index: Uint8Array, totalEpisodes: number) =>
		new Proxy({ "meta/info.json": info(totalEpisodes) } as Record<string, Uint8Array>, {
			get: (target, path: string) => target[path] ?? (path.startsWith("meta/episodes/") ? index : undefined),
		});

	/// Resumed recordings each start a new index file: one of 10 episodes, then 79 of 2.
	const files: Record<string, Uint8Array> = { "meta/info.json": info(168) };
	for (let file = 0; file < 80; file++) {
		files[indexFile(0, file)] = file === 0 ? shard(0, 10) : shard(10 + 2 * (file - 1), 2);
	}

	it("finds episodes past the 64th index file, opening each file once", async () => {
		const seen: string[] = [];
		const dataset = new LeRobotDataset(REPO_ID, { fetch: mockFetch(files, seen) });
		const episodes = await dataset.episodes({ offset: 153, limit: 3 });
		expect(episodes.map((episode) => episode.index)).toEqual([153, 154, 155]);
		/// Episodes 153 to 155 are in files 72 and 73; nothing past them is requested.
		expect(indexRequests(seen).sort()).toEqual(Array.from({ length: 74 }, (_, file) => indexFile(0, file)));
	});

	it("skips the files an earlier call walked", async () => {
		const seen: string[] = [];
		const dataset = new LeRobotDataset(REPO_ID, { fetch: mockFetch(files, seen) });
		await dataset.episodes({ offset: 153, limit: 3 });
		seen.length = 0;
		expect((await dataset.episodes({ offset: 160, limit: 1 })).map((episode) => episode.index)).toEqual([160]);
		/// The first walk ended at file 73, so files 74 and 75 are opened for their row counts on the way to
		/// file 76, which holds episode 160.
		expect(indexRequests(seen)).toEqual([indexFile(0, 74), indexFile(0, 75), indexFile(0, 76)]);
		seen.length = 0;
		expect((await dataset.episodes({ offset: 0, limit: 1 })).map((episode) => episode.index)).toEqual([0]);
		expect(indexRequests(seen)).toEqual([indexFile(0, 0)]);
	});

	it("reads up to the last index file when info.json counts more episodes", async () => {
		const seen: string[] = [];
		const dataset = new LeRobotDataset(REPO_ID, {
			fetch: mockFetch({ ...files, "meta/info.json": info(500) }, seen),
		});
		const episodes = await dataset.episodes({ offset: 160, limit: 100 });
		expect(episodes.map((episode) => episode.index)).toEqual([160, 161, 162, 163, 164, 165, 166, 167]);
		/// File 80 is the first missing one and ends the index; 81 to 85 were requested ahead of it.
		expect(indexRequests(seen).sort()).toEqual(Array.from({ length: 86 }, (_, file) => indexFile(0, file)));
	});

	it("ignores a file requested ahead that fails but is not needed", async () => {
		const failed: string[] = [];
		const serve = mockFetch({
			"meta/info.json": info(101),
			[indexFile(0, 0)]: shard(0, 1),
			[indexFile(0, 1)]: shard(1, 100),
		});
		/// File 0's single row makes the walk request 6 files ahead, though file 1 holds the page.
		const dataset = new LeRobotDataset(REPO_ID, {
			fetch: (async (input: RequestInfo | URL, init?: RequestInit) => {
				if (/file-00[2-6]\.parquet$/.test(String(input))) {
					failed.push(String(input));
					return new Response(null, { status: 500 });
				}
				return serve(input, init);
			}) as typeof fetch,
		});
		expect((await dataset.episodes({ offset: 50, limit: 1 })).map((episode) => episode.index)).toEqual([50]);
		expect(failed).toHaveLength(5);
	});

	it("fills the same walk from concurrent calls", async () => {
		const seen: string[] = [];
		const dataset = new LeRobotDataset(REPO_ID, { fetch: mockFetch(files, seen) });
		const [later, earlier] = await Promise.all([
			dataset.episodes({ offset: 153, limit: 3 }),
			dataset.episodes({ offset: 100, limit: 2 }),
		]);
		expect(later.map((episode) => episode.index)).toEqual([153, 154, 155]);
		expect(earlier.map((episode) => episode.index)).toEqual([100, 101]);
		seen.length = 0;
		expect((await dataset.episodes({ offset: 160, limit: 1 })).map((episode) => episode.index)).toEqual([160]);
		expect(indexRequests(seen)).toEqual([indexFile(0, 74), indexFile(0, 75), indexFile(0, 76)]);
	});

	it("moves to the next chunk after chunks_size files", async () => {
		const seen: string[] = [];
		const dataset = new LeRobotDataset(REPO_ID, {
			fetch: mockFetch(
				{
					"meta/info.json": info(5, 2),
					[indexFile(0, 0)]: shard(0, 1),
					[indexFile(0, 1)]: shard(1, 1),
					[indexFile(1, 0)]: shard(2, 1),
					[indexFile(1, 1)]: shard(3, 1),
					[indexFile(2, 0)]: shard(4, 1),
				},
				seen,
			),
		});
		expect((await dataset.episodes({ offset: 3, limit: 2 })).map((episode) => episode.index)).toEqual([3, 4]);
		expect(indexRequests(seen).sort()).toEqual([
			indexFile(0, 0),
			indexFile(0, 1),
			indexFile(1, 0),
			indexFile(1, 1),
			indexFile(2, 0),
		]);
	});

	it("ends the index at a missing file, and does not remember it", async () => {
		const serve = mockFetch({
			"meta/info.json": info(4, 2),
			[indexFile(0, 0)]: shard(0, 1),
			[indexFile(0, 1)]: shard(1, 1),
			[indexFile(1, 0)]: shard(2, 1),
			[indexFile(1, 1)]: shard(3, 1),
		});
		/// A one-off 404, so the next call can find the file.
		let missing = true;
		const dataset = new LeRobotDataset(REPO_ID, {
			fetch: (async (input: RequestInfo | URL, init?: RequestInit) => {
				if (missing && String(input).endsWith(indexFile(0, 1))) {
					missing = false;
					return new Response(null, { status: 404 });
				}
				return serve(input, init);
			}) as typeof fetch,
		});
		expect((await dataset.episodes({ limit: 4 })).map((episode) => episode.index)).toEqual([0]);
		expect((await dataset.episodes({ limit: 4 })).map((episode) => episode.index)).toEqual([0, 1, 2, 3]);
	});

	it("throws rather than walk an endless index", async () => {
		const dataset = new LeRobotDataset(REPO_ID, { fetch: mockFetch(everyIndexPath(shard(0, 1), 1_000_000)) });
		await expect(dataset.episodes({ offset: 20_000, limit: 1 })).rejects.toThrow(/more than 10000 index files/);
	});

	it("throws after one index file per episode when the files are empty", async () => {
		const seen: string[] = [];
		const empty = new Uint8Array(
			parquetWriteBuffer({ columnData: [{ name: "episode_index", type: "INT64", data: [] }] }),
		);
		const dataset = new LeRobotDataset(REPO_ID, { fetch: mockFetch(everyIndexPath(empty, 10), seen) });
		await expect(dataset.episodes({ offset: 0, limit: 10 })).rejects.toThrow(
			/more than 10 index files .*hold 0 episodes/,
		);
		/// One per episode of the page, plus the files requested ahead of the walk.
		expect(indexRequests(seen).length).toBeLessThanOrEqual(10 + 6);
	});
});

describe("v3 index columns", () => {
	it("downloads only the columns episodes are built from", async () => {
		const rows = 40;
		const int64 = (name: string, value: (row: number) => number) => ({
			name,
			type: "INT64" as const,
			data: Array.from({ length: rows }, (_, row) => BigInt(value(row))),
		});
		const stats = (name: string) => ({
			name,
			type: "STRING" as const,
			data: Array.from({ length: rows }, (_, row) => String(row).padEnd(100_000, "x")),
			codec: "UNCOMPRESSED" as const,
			encoding: "PLAIN" as const,
		});
		const indexPath = "meta/episodes/chunk-000/file-000.parquet";
		/// Real indexes also carry per-episode `stats/*` columns, which are most of the file, and can put
		/// other columns between the ones episodes are built from: yaak-ai/L2D keeps `dataset_to_index`
		/// after its stats.
		const index = new Uint8Array(
			parquetWriteBuffer({
				rowGroupSize: rows / 2,
				columnData: [
					int64("episode_index", (row) => row),
					int64("length", () => 10),
					int64("meta/episodes/chunk_index", () => 0),
					int64("data/chunk_index", () => 0),
					int64("data/file_index", () => 0),
					int64("dataset_from_index", (row) => row * 10),
					stats("stats/observation.state/mean"),
					int64("dataset_to_index", (row) => row * 10 + 10),
					stats("stats/action/mean"),
				],
			}),
		);
		const serve = mockFetch({
			"meta/info.json": encoder.encode(
				JSON.stringify({
					codebase_version: "v3.0",
					fps: 30,
					total_episodes: rows,
					data_path: "data/chunk-{chunk_index:03d}/file-{file_index:03d}.parquet",
				}),
			),
			[indexPath]: index,
		});
		let indexBytes = 0;
		let indexRequests = 0;
		const dataset = new LeRobotDataset(REPO_ID, {
			fetch: (async (input: RequestInfo | URL, init?: RequestInit) => {
				const response = await serve(input, init);
				if (String(input).endsWith(indexPath)) {
					indexBytes += (await response.clone().arrayBuffer()).byteLength;
					indexRequests++;
				}
				return response;
			}) as typeof fetch,
		});

		const episodes = await dataset.episodes({ limit: 3 });
		expect(episodes.map((episode) => episode.index)).toEqual([0, 1, 2]);
		expect(episodes.map((episode) => episode.data?.toRow)).toEqual([10, 20, 30]);
		expect(indexBytes).toBeLessThan(index.byteLength / 4);
		/// The tail with the footer, then from the first row group only: the columns before the stats, the
		/// unread one between them included, in one request, and `dataset_to_index` in another.
		expect(indexRequests).toBe(3);
	});

	it("reads each camera's video file and segment", async () => {
		const camera = "observation.images.up";
		const dataset = new LeRobotDataset(REPO_ID, {
			fetch: mockFetch({
				"meta/info.json": encoder.encode(
					JSON.stringify({
						codebase_version: "v3.0",
						fps: 30,
						total_episodes: 1,
						data_path: "data/chunk-{chunk_index:03d}/file-{file_index:03d}.parquet",
						video_path: "videos/{video_key}/chunk-{chunk_index:03d}/file-{file_index:03d}.mp4",
						features: { [camera]: { dtype: "video", shape: [480, 640, 3] } },
					}),
				),
				"meta/episodes/chunk-000/file-000.parquet": parquet([
					{
						episode_index: 0,
						length: 60,
						[`videos/${camera}/chunk_index`]: 1,
						[`videos/${camera}/file_index`]: 2,
						[`videos/${camera}/from_timestamp`]: 4,
						[`videos/${camera}/to_timestamp`]: 6,
					},
				]),
			}),
		});

		const [episode] = await dataset.episodes({ limit: 1 });
		expect(episode.videos).toEqual([
			{ cameraKey: camera, url: dataset.fileUrl(`videos/${camera}/chunk-001/file-002.mp4`), fromSec: 4, toSec: 6 },
		]);
	});
});

describe("episode by index", () => {
	const range = (from: number, to: number) => Array.from({ length: to - from }, (_, i) => from + i);
	const indexFile = (file: number) => `meta/episodes/chunk-000/file-${String(file).padStart(3, "0")}.parquet`;
	const indexRequests = (seen: string[]) => seen.filter((path) => path.startsWith("meta/episodes"));
	/// Episode `index` is `index + 1` frames long, so the length also tells which row was read.
	const v3 = (indexes: number[], { totalEpisodes = indexes.length, perFile = 5, statistics = true } = {}) => {
		const files: Record<string, Uint8Array> = {
			"meta/info.json": encoder.encode(
				JSON.stringify({
					codebase_version: "v3.0",
					fps: 30,
					total_episodes: totalEpisodes,
					data_path: "data/chunk-{chunk_index:03d}/file-{file_index:03d}.parquet",
				}),
			),
		};
		for (let file = 0; file * perFile < indexes.length; file++) {
			files[indexFile(file)] = parquet(
				indexes
					.slice(file * perFile, (file + 1) * perFile)
					.map((episode_index) => ({ episode_index, length: episode_index + 1 })),
				{ statistics },
			);
		}
		return files;
	};
	/// Long enough lines that 100 episodes outgrow the first prefix read.
	const task = "put the red cube in the box ".repeat(8);
	const v2 = (indexes: number[], totalEpisodes = indexes.length) => ({
		"meta/info.json": encoder.encode(
			JSON.stringify({
				codebase_version: "v2.1",
				fps: 30,
				total_episodes: totalEpisodes,
				chunks_size: 1000,
				data_path: "data/chunk-{episode_chunk:03d}/episode_{episode_index:06d}.parquet",
			}),
		),
		"meta/episodes.jsonl": encoder.encode(
			indexes
				.map((episode_index) => JSON.stringify({ episode_index, tasks: [task], length: episode_index + 1 }))
				.join("\n") + "\n",
		),
	});
	const lookup = async (files: Record<string, Uint8Array>, index: number) => {
		const seen: string[] = [];
		const episode = await new LeRobotDataset(REPO_ID, { fetch: mockFetch(files, seen) }).episode(index);
		return { episode, seen };
	};

	it("costs what episodes({ offset: index, limit: 1 }) does when indexes count from 0", async () => {
		const cases: [Record<string, Uint8Array>, number[]][] = [
			[v3(range(0, 40)), [0, 7, 39]],
			[v2(range(0, 100)), [0, 70, 99]],
		];
		for (const [files, indexes] of cases) {
			for (const index of indexes) {
				const positional: string[] = [];
				const dataset = new LeRobotDataset(REPO_ID, { fetch: mockFetch(files, positional) });
				const [expected] = await dataset.episodes({ offset: index, limit: 1 });
				const { episode, seen } = await lookup(files, index);
				expect(episode?.index).toBe(index);
				expect(episode).toEqual(expected);
				expect(seen).toEqual(positional);
			}
		}
	});

	it("finds episodes numbered from 10, with gaps, and past info.json's count", async () => {
		const indexes = [10, 11, 12, 14, 15, 20, 21, 22, 30, 31, 40, 52];
		for (const files of [v3(indexes), v2(indexes)]) {
			for (const index of [10, 14, 22, 31, 40, 52]) {
				const { episode } = await lookup(files, index);
				expect(episode?.index).toBe(index);
				expect(episode?.length).toBe(index + 1);
			}
			for (const index of [0, 9, 13, 16, 25, 51, 53, 10_000]) {
				expect((await lookup(files, index)).episode).toBeUndefined();
			}
		}
	});

	it("returns undefined for an index that is not a non-negative integer, without a request", async () => {
		for (const index of [-1, 2.5, NaN, Infinity]) {
			const { episode, seen } = await lookup(v3(range(0, 5)), index);
			expect(episode).toBeUndefined();
			expect(seen).toEqual([]);
		}
	});

	it("stops at the first index file past the episode", async () => {
		const files = v3(range(10, 50));
		expect(indexRequests((await lookup(files, 5)).seen)).toEqual([indexFile(0)]);
		/// Rows 10 to 14 are in file 0, and 13 is row 3 of it.
		expect(indexRequests((await lookup(files, 13)).seen)).toEqual([indexFile(0)]);
	});

	it("skips the index files an earlier lookup walked", async () => {
		const seen: string[] = [];
		const dataset = new LeRobotDataset(REPO_ID, { fetch: mockFetch(v3(range(10, 50)), seen) });
		expect((await dataset.episode(37))?.index).toBe(37);
		seen.length = 0;
		expect((await dataset.episode(42))?.index).toBe(42);
		expect(indexRequests(seen)).toEqual([indexFile(6)]);
		seen.length = 0;
		expect((await dataset.episode(12))?.index).toBe(12);
		expect(indexRequests(seen)).toEqual([indexFile(0)]);
		seen.length = 0;
		/// Positional reads use the same files.
		expect((await dataset.episodes({ offset: 25, limit: 1 }))[0]?.index).toBe(35);
		expect(indexRequests(seen)).toEqual([indexFile(5)]);
	});

	it("does not look past info.json's count, so a stale index file is not found", async () => {
		const files = { ...v3([0, 4, 9], { totalEpisodes: 3 }), [indexFile(1)]: v3(range(0, 20))[indexFile(0)] };
		expect((await lookup(files, 9)).episode?.index).toBe(9);
		const { episode, seen } = await lookup(files, 15);
		expect(episode).toBeUndefined();
		expect(seen).not.toContain(indexFile(1));
	});

	it("searches a row group by its statistics", async () => {
		const indexes = [10, 11, 12, 13, 20, 21, 22, 23, 30, 31, 35, 36];
		const files = {
			...v3(indexes),
			[indexFile(0)]: new Uint8Array(
				parquetWriteBuffer({
					rowGroupSize: 4,
					columnData: [
						{ name: "episode_index", type: "INT64", data: indexes.map(BigInt) },
						{ name: "length", type: "INT64", data: indexes.map((index) => BigInt(index + 1)) },
					],
				}),
			),
		};
		for (const index of [10, 21, 31, 35, 36]) {
			expect((await lookup(files, index)).episode?.length).toBe(index + 1);
		}
		for (const index of [15, 24, 33, 37]) {
			expect((await lookup(files, index)).episode).toBeUndefined();
		}
	});

	it("reads an index without footer statistics", async () => {
		for (const indexes of [range(0, 12), [10, 11, 12, 14, 15, 20, 21, 22, 30, 31, 40, 52]]) {
			const files = v3(indexes, { statistics: false });
			for (const index of indexes) {
				expect((await lookup(files, index)).episode?.length).toBe(index + 1);
			}
			expect((await lookup(files, 13)).episode).toBeUndefined();
			expect((await lookup(files, 53)).episode).toBeUndefined();
		}
	});

	it("reads meta/episodes.jsonl only up to the episode", async () => {
		/// 100 episodes numbered 10, 20, ...: episode 200 is line 19, in the first prefix read.
		const files = v2(range(1, 101).map((n) => n * 10));
		expect(files["meta/episodes.jsonl"].byteLength).toBeGreaterThan(16 * 1024);
		for (const index of [200, 205]) {
			const { episode, seen } = await lookup(files, index);
			expect(episode?.index).toBe(index === 200 ? 200 : undefined);
			expect(seen.filter((path) => path === "meta/episodes.jsonl")).toHaveLength(1);
		}
	});
});
