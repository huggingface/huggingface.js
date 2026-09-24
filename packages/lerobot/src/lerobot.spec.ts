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

	it("reads camera axes in the order `names` gives, not the usual one", () => {
		const base = {
			codebase_version: "v3.0",
			fps: 30,
			total_episodes: 1,
			data_path: "data/chunk-{chunk_index:03d}/file-{file_index:03d}.parquet",
		};
		/// Converters that write channel-first say so in `names`; taking shape[0] as the height gives
		/// a camera 3 pixels tall.
		const channelFirst = parseInfo(
			JSON.stringify({
				...base,
				features: {
					"observation.images.cam": {
						dtype: "video",
						shape: [3, 480, 640],
						names: ["channels", "height", "width"],
					},
				},
			}),
		);
		expect(channelFirst.cameras[0]).toMatchObject({ width: 640, height: 480 });

		const channelLast = parseInfo(
			JSON.stringify({
				...base,
				features: {
					"observation.images.cam": {
						dtype: "video",
						shape: [480, 640, 3],
						names: ["height", "width", "channels"],
					},
				},
			}),
		);
		expect(channelLast.cameras[0]).toMatchObject({ width: 640, height: 480 });

		/// No `names` at all is the common case and keeps the old reading.
		const unnamed = parseInfo(
			JSON.stringify({
				...base,
				features: { "observation.images.cam": { dtype: "video", shape: [480, 640, 3] } },
			}),
		);
		expect(unnamed.cameras[0]).toMatchObject({ width: 640, height: 480 });
	});

	it("prefers the size written beside the codec over `shape`", () => {
		const info = parseInfo(
			JSON.stringify({
				codebase_version: "v3.0",
				fps: 30,
				total_episodes: 1,
				data_path: "data/chunk-{chunk_index:03d}/file-{file_index:03d}.parquet",
				features: {
					"observation.images.cam": {
						dtype: "video",
						shape: [3, 480, 640],
						info: { "video.codec": "av1", "video.height": 480, "video.width": 640 },
					},
				},
			}),
		);
		expect(info.cameras[0]).toMatchObject({ width: 640, height: 480, codec: "av1" });
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
