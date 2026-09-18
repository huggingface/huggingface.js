import type { FetchOptions, RandomAccessFile } from "./http";
import type { LeRobotEpisode, LeRobotEpisodeVideo, LeRobotInfo } from "./types";

import { fetchRange, fetchTextPrefix, openRemoteFile } from "./http";
import { formatPathTemplate } from "./paths";

/** v3 keeps its episode index in parquet under a fixed layout; the path is not templated in info.json. */
export function episodesMetadataPath(chunkIndex: number, fileIndex: number): string {
	const chunk = String(chunkIndex).padStart(3, "0");
	const file = String(fileIndex).padStart(3, "0");
	return `meta/episodes/chunk-${chunk}/file-${file}.parquet`;
}

/** Enough for ~10 episodes of `meta/episodes.jsonl`; grown geometrically when it is not. */
const JSONL_INITIAL_PREFIX_BYTES = 8 * 1024;
const JSONL_MAX_PREFIX_BYTES = 4 * 1024 * 1024;

function toNumber(value: unknown): number | undefined {
	if (typeof value === "bigint") {
		return Number(value);
	}
	return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function toTasks(value: unknown): string[] {
	if (!Array.isArray(value)) {
		return typeof value === "string" ? [value] : [];
	}
	return value.filter((task): task is string => typeof task === "string");
}

interface RawEpisode {
	index: number;
	length: number;
	tasks: string[];
	/** v3 only; v2 episodes each have their own files. */
	v3?: {
		dataChunk: number;
		dataFile: number;
		fromRow: number;
		toRow: number;
		videos: Record<string, { chunk: number; file: number; fromSec: number; toSec: number }>;
	};
}

function buildEpisode(raw: RawEpisode, info: LeRobotInfo, toUrl: (path: string) => string): LeRobotEpisode {
	const videos: LeRobotEpisodeVideo[] = [];
	const fallbackDuration = raw.length / info.fps;

	if (info.videoPath !== undefined) {
		for (const camera of info.cameras) {
			const location = raw.v3?.videos[camera.key];
			const path = formatPathTemplate(info.videoPath, {
				video_key: camera.key,
				episode_chunk: Math.floor(raw.index / info.chunksSize),
				episode_index: raw.index,
				chunk_index: location?.chunk ?? 0,
				file_index: location?.file ?? 0,
			});
			videos.push({
				cameraKey: camera.key,
				url: toUrl(path),
				fromSec: location?.fromSec ?? 0,
				toSec: location?.toSec ?? fallbackDuration,
			});
		}
	}

	const dataPath = formatPathTemplate(info.dataPath, {
		episode_chunk: Math.floor(raw.index / info.chunksSize),
		episode_index: raw.index,
		chunk_index: raw.v3?.dataChunk ?? 0,
		file_index: raw.v3?.dataFile ?? 0,
	});

	const first = videos[0];
	return {
		index: raw.index,
		length: raw.length,
		durationSec: first !== undefined ? first.toSec - first.fromSec : fallbackDuration,
		tasks: raw.tasks,
		videos,
		data: {
			url: toUrl(dataPath),
			fromRow: raw.v3?.fromRow ?? 0,
			toRow: raw.v3?.toRow ?? raw.length,
		},
	};
}

/**
 * Reads `meta/episodes.jsonl` (v2.0 / v2.1).
 *
 * Only a prefix of the file is fetched: the largest published LeRobot datasets have a 40 MB+ index,
 * and the first handful of episodes live in its first kilobyte.
 */
async function readEpisodesV2(
	url: string,
	offset: number,
	limit: number,
	options?: FetchOptions,
): Promise<RawEpisode[]> {
	const wanted = offset + limit;
	let prefixBytes = JSONL_INITIAL_PREFIX_BYTES;

	for (;;) {
		const text = await fetchTextPrefix(url, prefixBytes, options);
		const lines = text.split("\n");
		/// A prefix read almost always cuts the final line in half, so drop it unless we reached EOF.
		const complete = text.length < prefixBytes ? lines : lines.slice(0, -1);
		const parsed: RawEpisode[] = [];

		for (const line of complete) {
			if (line.trim().length === 0) {
				continue;
			}
			const row: unknown = JSON.parse(line);
			if (typeof row !== "object" || row === null) {
				continue;
			}
			const record = row as Record<string, unknown>;
			const index = toNumber(record.episode_index);
			const length = toNumber(record.length);
			if (index === undefined || length === undefined) {
				continue;
			}
			parsed.push({ index, length, tasks: toTasks(record.tasks) });
		}

		if (parsed.length >= wanted || text.length < prefixBytes || prefixBytes >= JSONL_MAX_PREFIX_BYTES) {
			return parsed.slice(offset, wanted);
		}
		prefixBytes = Math.min(prefixBytes * 4, JSONL_MAX_PREFIX_BYTES);
	}
}

/** The slice of hyparquet this package uses, declared locally so its types stay optional. */
interface HyparquetModule {
	parquetReadObjects(options: {
		file: RandomAccessFile;
		rowStart?: number;
		rowEnd?: number;
	}): Promise<Record<string, unknown>[]>;
}

async function loadHyparquet(): Promise<HyparquetModule> {
	try {
		return (await import("hyparquet")) as unknown as HyparquetModule;
	} catch {
		throw new Error(
			"Reading a v3.0 LeRobot dataset needs the optional peer dependency `hyparquet`. Install it with `npm install hyparquet`.",
		);
	}
}

/** Reads the v3.0 episode index under `meta/episodes/`. */
async function readEpisodesV3(
	toUrl: (path: string) => string,
	info: LeRobotInfo,
	offset: number,
	limit: number,
	options?: FetchOptions,
): Promise<RawEpisode[]> {
	const { parquetReadObjects } = await loadHyparquet();
	const file = await openRemoteFile(toUrl(episodesMetadataPath(0, 0)), options);
	const rows = await parquetReadObjects({ file, rowStart: offset, rowEnd: offset + limit });

	return rows.map((row: Record<string, unknown>): RawEpisode => {
		const index = toNumber(row.episode_index) ?? 0;
		const length = toNumber(row.length) ?? 0;
		const videos: NonNullable<RawEpisode["v3"]>["videos"] = {};

		for (const camera of info.cameras) {
			const prefix = `videos/${camera.key}/`;
			videos[camera.key] = {
				chunk: toNumber(row[`${prefix}chunk_index`]) ?? 0,
				file: toNumber(row[`${prefix}file_index`]) ?? 0,
				fromSec: toNumber(row[`${prefix}from_timestamp`]) ?? 0,
				toSec: toNumber(row[`${prefix}to_timestamp`]) ?? length / info.fps,
			};
		}

		return {
			index,
			length,
			tasks: toTasks(row.tasks),
			v3: {
				dataChunk: toNumber(row["data/chunk_index"]) ?? 0,
				dataFile: toNumber(row["data/file_index"]) ?? 0,
				fromRow: toNumber(row.dataset_from_index) ?? 0,
				toRow: toNumber(row.dataset_to_index) ?? length,
				videos,
			},
		};
	});
}

export async function readEpisodes(
	info: LeRobotInfo,
	toUrl: (path: string) => string,
	offset: number,
	limit: number,
	options?: FetchOptions,
): Promise<LeRobotEpisode[]> {
	const raw =
		info.codebaseVersion === "v3.0"
			? await readEpisodesV3(toUrl, info, offset, limit, options)
			: await readEpisodesV2(toUrl("meta/episodes.jsonl"), offset, limit, options);
	return raw.map((episode) => buildEpisode(episode, info, toUrl));
}

/** Re-exported for tests and callers that want to read a row range themselves. */
export { fetchRange };
