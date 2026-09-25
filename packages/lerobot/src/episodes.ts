import type { FetchOptions, RandomAccessFile } from "./http";
import type { LeRobotEpisode, LeRobotEpisodeData, LeRobotEpisodeVideo, LeRobotInfo } from "./types";

import { fetchRange, fetchTextPrefix, HttpError, openRemoteFile, TAIL_PROBE_BYTES } from "./http";
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
/** Bounds the shard walk so a pathological `offset` cannot loop forever (CWE-835). */
const MAX_INDEX_FILES = 64;

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

type BuiltEpisode = LeRobotEpisode & { data: LeRobotEpisodeData };

function buildEpisode(raw: RawEpisode, info: LeRobotInfo, toUrl: (path: string) => string): BuiltEpisode {
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
		const { text, byteLength } = await fetchTextPrefix(url, prefixBytes, options);
		/// `byteLength`, not `text.length`: a UTF-8 string is shorter than its byte count for any
		/// non-ASCII task description, which would otherwise look like end-of-file.
		const reachedEof = byteLength < prefixBytes;
		const lines = text.split("\n");
		/// A prefix read almost always cuts the final line in half, so drop it unless we reached EOF.
		const complete = reachedEof ? lines : lines.slice(0, -1);
		const parsed: RawEpisode[] = [];

		for (const line of complete) {
			if (line.trim().length === 0) {
				continue;
			}
			let row: unknown;
			try {
				row = JSON.parse(line);
			} catch {
				/// One malformed line should not fail the whole listing.
				continue;
			}
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

		if (parsed.length >= wanted || reachedEof || prefixBytes >= JSONL_MAX_PREFIX_BYTES) {
			return parsed.slice(offset, wanted);
		}
		prefixBytes = Math.min(prefixBytes * 4, JSONL_MAX_PREFIX_BYTES);
	}
}

/**
 * hyparquet is a hard dependency but is still loaded on demand: callers that only need `info()` or a
 * v2 dataset never pay for the parquet reader.
 */
async function loadHyparquet() {
	return import("hyparquet");
}

function toRawEpisodeV3(row: Record<string, unknown>, info: LeRobotInfo): RawEpisode {
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
}

/**
 * Reads the v3.0 episode index under `meta/episodes/`.
 *
 * The index is sharded: `chunks_size` files per chunk directory, so a request can span several of
 * them. Files are walked in order, skipping whole shards that fall before `offset` using only their
 * parquet footer, and stopping at the first missing shard.
 */
async function readEpisodesV3(
	toUrl: (path: string) => string,
	info: LeRobotInfo,
	offset: number,
	limit: number,
	options?: FetchOptions,
): Promise<RawEpisode[]> {
	const { parquetMetadataAsync, parquetReadObjects } = await loadHyparquet();
	const collected: RawEpisode[] = [];
	let chunkIndex = 0;
	let fileIndex = 0;
	let seen = 0;

	for (let visited = 0; visited < MAX_INDEX_FILES && collected.length < limit; visited++) {
		let file: RandomAccessFile;
		try {
			file = await openRemoteFile(toUrl(episodesMetadataPath(chunkIndex, fileIndex)), options);
		} catch (error) {
			if (!(error instanceof HttpError) || error.status !== 404) {
				throw error;
			}
			/// Files run out within a chunk before the chunk itself runs out.
			if (fileIndex === 0) {
				break;
			}
			chunkIndex++;
			fileIndex = 0;
			continue;
		}

		const metadata = await parquetMetadataAsync(file, { initialFetchSize: TAIL_PROBE_BYTES });
		const rowCount = Number(metadata.num_rows);
		if (seen + rowCount > offset) {
			const rowStart = Math.max(0, offset - seen);
			const rowEnd = Math.min(rowCount, offset + limit - seen);
			const rows = await parquetReadObjects({ file, metadata, rowStart, rowEnd });
			for (const row of rows) {
				collected.push(toRawEpisodeV3(row, info));
			}
		}
		seen += rowCount;
		fileIndex++;
	}

	return collected;
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
	const episodes = raw.map((episode) => buildEpisode(episode, info, toUrl));
	return info.codebaseVersion === "v3.0" ? toFileRows(episodes, offset, options) : episodes;
}

/**
 * First `index` of a v3 data file. Taken from the footer's column statistics when present, so the
 * column itself is not downloaded; data files are written in `index` order, so the minimum is row 0.
 */
async function readFileStart(url: string, options?: FetchOptions): Promise<number> {
	const { parquetMetadataAsync, parquetReadObjects } = await loadHyparquet();
	const file = await openRemoteFile(url, options);
	const metadata = await parquetMetadataAsync(file, { initialFetchSize: TAIL_PROBE_BYTES });
	const column = metadata.row_groups[0]?.columns.find(
		(chunk) => chunk.meta_data?.path_in_schema.length === 1 && chunk.meta_data.path_in_schema[0] === "index",
	);
	let start = toNumber(column?.meta_data?.statistics?.min_value);
	if (start === undefined) {
		const [first] = await parquetReadObjects({ file, metadata, columns: ["index"], rowEnd: 1 });
		start = toNumber(first?.index);
	}
	if (start === undefined || !Number.isSafeInteger(start) || start < 0) {
		throw new Error(`Invalid first frame index in ${url}`);
	}
	return start;
}

/**
 * v3 metadata carries dataset-wide frame indexes; callers need row offsets inside `data.url`.
 *
 * Data files are written in episode order, so an episode whose file differs from the previous
 * episode's is the first in its file, and that file starts at the episode's own dataset index. Only a
 * file whose first episode falls before the requested page needs a remote read.
 */
async function toFileRows(episodes: BuiltEpisode[], offset: number, options?: FetchOptions): Promise<LeRobotEpisode[]> {
	const fileStarts = new Map<string, Promise<number | undefined>>();
	episodes.forEach((episode, position) => {
		const { url, fromRow } = episode.data;
		if (fileStarts.has(url)) {
			return;
		}
		const startsFile = position === 0 ? offset === 0 : episodes[position - 1].data.url !== url;
		/// A data file that cannot be read drops the row range of its episodes, not the whole listing.
		fileStarts.set(url, startsFile ? Promise.resolve(fromRow) : readFileStart(url, options).catch(() => undefined));
	});

	return Promise.all(
		episodes.map(async (episode): Promise<LeRobotEpisode> => {
			const { data, ...rest } = episode;
			const start = await fileStarts.get(data.url);
			if (start === undefined) {
				return rest;
			}
			const fromRow = data.fromRow - start;
			const toRow = data.toRow - start;
			/// Metadata that disagrees with the data file would yield a range that is not in it.
			if (fromRow < 0 || toRow < fromRow) {
				return rest;
			}
			return { ...rest, data: { url: data.url, fromRow, toRow } };
		}),
	);
}

/** Re-exported for tests and callers that want to read a row range themselves. */
export { fetchRange };
