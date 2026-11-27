import type { FileMetaData, RowGroup } from "hyparquet";
import type { FetchOptions, RandomAccessFile } from "./http";
import type { LeRobotEpisode, LeRobotEpisodeData, LeRobotEpisodeVideo, LeRobotInfo } from "./types";

import { fetchRange, HttpError, openRemoteFile, TAIL_PROBE_BYTES } from "./http";
import { loadParquet } from "./parquet";
import { formatPathTemplate } from "./paths";

/** v3 keeps its episode index in parquet under a fixed layout; the path is not templated in info.json. */
export function episodesMetadataPath(chunkIndex: number, fileIndex: number): string {
	const chunk = String(chunkIndex).padStart(3, "0");
	const file = String(fileIndex).padStart(3, "0");
	return `meta/episodes/chunk-${chunk}/file-${file}.parquet`;
}

/** Enough for ~10 episodes of `meta/episodes.jsonl`, the page most callers ask for first. */
const JSONL_FIRST_READ_BYTES = 8 * 1024;
/** Caps one read, so the largest indexes (near 100 MB) are never held whole. */
const JSONL_MAX_READ_BYTES = 16 * 1024 * 1024;
/**
 * Nothing in the user-controlled file bounds a listing, so reading stops here (the largest index is
 * 97 MB). A listing that needs more throws rather than coming back short.
 */
const JSONL_MAX_BYTES = 256 * 1024 * 1024;
/** Real lines are under a kilobyte; a file without line breaks would otherwise be held whole. */
const JSONL_MAX_LINE_LENGTH = 1024 * 1024;
/**
 * Bounds the walk against a server that keeps answering. Resumed recordings each add a file, so real
 * indexes reach a thousand.
 */
const MAX_INDEX_FILES = 10_000;
/** Index files requested ahead of the walk: a browser's HTTP/1.1 connections per host. */
const INDEX_FILES_AHEAD = 6;

/** An index file found by an earlier walk, so a later one can skip it without a request. */
export interface IndexShard {
	chunk: number;
	file: number;
	rows: number;
	/** Largest `episode_index` in the file, when its footer has statistics for every row group. */
	lastIndex?: number;
}

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
 * Reads `meta/episodes.jsonl` (v2.x) from its start up to the last line asked for, each read continuing
 * where the previous one stopped. `until` ends the read early, once a line satisfies it.
 */
async function readEpisodesV2(
	url: string,
	offset: number,
	limit: number,
	options?: FetchOptions,
	until?: (episode: RawEpisode) => boolean,
): Promise<RawEpisode[]> {
	const wanted = offset + limit;
	const episodes: RawEpisode[] = [];
	const decoder = new TextDecoder();
	/// The line the previous read cut in half.
	let carry = "";
	let position = 0;
	let readTo = 0;
	let total: number | undefined;
	/// Where the next read ends, exclusive.
	let stop = JSONL_FIRST_READ_BYTES;

	for (;;) {
		const end = Math.min(stop, total ?? Infinity) - 1;
		const requested = end - readTo + 1;
		let bytes: Uint8Array = new Uint8Array(0);
		let whole = false;
		try {
			const result = await fetchRange(url, readTo, end, options);
			bytes = result.bytes;
			total = result.total ?? total;
			whole = !result.partial;
		} catch (error) {
			/// Without Content-Range, a file that ends exactly where the previous read did answers 416 here.
			if (!(error instanceof HttpError) || error.status !== 416 || readTo === 0) {
				throw error;
			}
		}
		/// A 200 is the whole file (Range ignored). Its length can't tell: a file the size of the first read
		/// would be counted twice.
		if (whole) {
			bytes = bytes.subarray(readTo);
		}
		readTo += bytes.byteLength;
		/// With a known size, a short read is not the end (servers may cap a response), but an empty one is.
		const eof =
			whole || bytes.byteLength === 0 || (total === undefined ? bytes.byteLength < requested : readTo >= total);
		/// `stream` holds back a multi-byte character the read cut, until the next read completes it.
		const lines = (carry + decoder.decode(bytes, { stream: !eof })).split("\n");
		carry = eof ? "" : (lines.pop() ?? "");

		for (const line of lines) {
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
			const episode = { index, length, tasks: toTasks(record.tasks) };
			if (position >= offset) {
				episodes.push(episode);
			}
			position++;
			if (position >= wanted || until?.(episode)) {
				return episodes;
			}
		}

		if (eof) {
			return episodes;
		}
		if (carry.length > JSONL_MAX_LINE_LENGTH) {
			throw new Error(`${url} has a line longer than ${JSONL_MAX_LINE_LENGTH} characters`);
		}
		if (readTo >= JSONL_MAX_BYTES) {
			throw new Error(`Stopped reading ${url} at ${JSONL_MAX_BYTES} bytes, before the episodes asked for`);
		}
		/// Sized from the bytes per line so far, and never less than what has been read, so reads stay few.
		const target = readTo + Math.max(readTo, Math.ceil(((wanted - position) * readTo * 1.25) / Math.max(1, position)));
		/// Rounded to 8 KiB times a power of 2, then whole 16 MiB blocks, so nearby pages send the same ranges.
		stop = JSONL_FIRST_READ_BYTES;
		while (stop < target) {
			stop *= 2;
		}
		stop = Math.min(stop, (Math.floor(readTo / JSONL_MAX_READ_BYTES) + 1) * JSONL_MAX_READ_BYTES);
	}
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

/** Statistics of a top-level column in one row group, as written in the parquet footer. */
function columnStatistics(group: RowGroup | undefined, name: string) {
	return group?.columns.find(
		(chunk) => chunk.meta_data?.path_in_schema.length === 1 && chunk.meta_data.path_in_schema[0] === name,
	)?.meta_data?.statistics;
}

function lastEpisodeIndex(metadata: FileMetaData): number | undefined {
	/// -1 for an empty file, so a lookup passes it over.
	let last = -1;
	for (const group of metadata.row_groups) {
		const max = toNumber(columnStatistics(group, "episode_index")?.max_value);
		if (max === undefined) {
			return undefined;
		}
		last = Math.max(last, max);
	}
	return last;
}

/** Where a walk of the index files stops, and which files it needs; `seen` counts the rows before `shard`. */
interface IndexWalk {
	/** Rows to walk, counted from the start of the first index file. */
	end: number;
	/** Whether a file an earlier walk found can be passed over without a request. */
	skip(shard: IndexShard, seen: number): boolean;
	/** Rows the walk may still need past a file, which sizes the requests made ahead of it. */
	rowsAfter(shard: IndexShard, seen: number): number;
}

interface IndexFile {
	file: RandomAccessFile;
	metadata: FileMetaData;
	/** Rows in the index files before this one. */
	seen: number;
}

/**
 * Opens the v3.0 index files in order, until `walk.end` rows or the first missing file. `shards`
 * remembers the files already walked, so a later walk skips them without a request.
 */
async function* walkIndexFiles(
	toUrl: (path: string) => string,
	info: LeRobotInfo,
	shards: IndexShard[],
	walk: IndexWalk,
	options?: FetchOptions,
): AsyncGenerator<IndexFile> {
	const { parquetMetadataAsync } = await loadParquet();
	/// Files requested ahead of the walk, until it takes them; a long walk holds only those few.
	const opening = new Map<string, Promise<{ file: RandomAccessFile; metadata: FileMetaData } | undefined>>();
	const open = (chunk: number, file: number) => {
		const path = episodesMetadataPath(chunk, file);
		let opened = opening.get(path);
		if (opened === undefined) {
			opened = openRemoteFile(toUrl(path), options).then(
				async (remote) => ({
					file: remote,
					metadata: await parquetMetadataAsync(remote, { initialFetchSize: TAIL_PROBE_BYTES }),
				}),
				(error: unknown) => {
					if (error instanceof HttpError && error.status === 404) {
						return undefined;
					}
					throw error;
				},
			);
			/// A file requested ahead may never be taken; its failure matters only once it is.
			opened.catch(() => {});
			opening.set(path, opened);
		}
		return opened;
	};
	const take = (chunk: number, file: number) => {
		const opened = open(chunk, file);
		opening.delete(episodesMetadataPath(chunk, file));
		return opened;
	};
	const nextFile = (chunk: number, file: number) =>
		file + 1 < info.chunksSize ? { chunk, file: file + 1 } : { chunk: chunk + 1, file: 0 };

	const { end } = walk;
	/// LeRobot writes no empty index file, so `end` files are enough; this stops a server that answers
	/// every path with an empty one.
	const maxFiles = Math.min(MAX_INDEX_FILES, end);
	let next = { chunk: 0, file: 0 };
	let seen = 0;

	for (let position = 0; seen < end; position++) {
		if (position >= maxFiles) {
			throw new Error(
				`Reading episodes up to ${end - 1} needs more than ${maxFiles} index files under ${toUrl("meta/episodes")}, and those hold ${seen} episodes`,
			);
		}
		const known = shards[position];
		if (known !== undefined && walk.skip(known, seen)) {
			seen += known.rows;
			next = nextFile(known.chunk, known.file);
			continue;
		}

		const { chunk: chunkIndex, file: fileIndex } = known ?? next;
		/// A missing file ends the index. Trying the next chunk would turn a transient 404 into a wrong
		/// position that `shards` keeps.
		const opened = await take(chunkIndex, fileIndex);
		if (opened === undefined) {
			return;
		}

		const shard: IndexShard = {
			chunk: chunkIndex,
			file: fileIndex,
			rows: Number(opened.metadata.num_rows),
			lastIndex: lastEpisodeIndex(opened.metadata),
		};
		shards[position] = shard;
		next = nextFile(chunkIndex, fileIndex);

		/// The next few files at once, as many as the walk needs if they hold as many rows as this one.
		const ahead = Math.min(INDEX_FILES_AHEAD, Math.ceil(walk.rowsAfter(shard, seen) / Math.max(shard.rows, 1)));
		let upcoming = next;
		for (let i = 0; i < ahead; i++) {
			open(upcoming.chunk, upcoming.file);
			upcoming = nextFile(upcoming.chunk, upcoming.file);
		}
		yield { ...opened, seen };
		seen += shard.rows;
	}
}

/** Rows `[rowStart, rowEnd)` of one index file. */
async function readIndexRows(
	info: LeRobotInfo,
	{ file, metadata }: IndexFile,
	rowStart: number,
	rowEnd: number,
): Promise<RawEpisode[]> {
	const { compressors, parquetReadObjects, parquetSchema } = await loadParquet();
	/// Only what `toRawEpisodeV3` reads: hyparquet would decode the `stats/*` list columns for the whole row group.
	const wanted = [
		"episode_index",
		"length",
		"tasks",
		"data/chunk_index",
		"data/file_index",
		"dataset_from_index",
		"dataset_to_index",
		...info.cameras.flatMap((camera) =>
			["chunk_index", "file_index", "from_timestamp", "to_timestamp"].map((field) => `videos/${camera.key}/${field}`),
		),
	];
	/// hyparquet throws on a column the file lacks; `toRawEpisodeV3` defaults the absent ones.
	const present = new Set(parquetSchema(metadata).children.map((child) => child.element.name));
	const columns = wanted.filter((column) => present.has(column));
	const rows = await parquetReadObjects({ file, metadata, columns, rowStart, rowEnd, compressors });
	return rows.map((row) => toRawEpisodeV3(row, info));
}

/** Reads rows `[offset, offset + limit)` of the v3.0 episode index, passing over the files before `offset`. */
async function readEpisodesV3(
	toUrl: (path: string) => string,
	info: LeRobotInfo,
	offset: number,
	limit: number,
	shards: IndexShard[],
	options?: FetchOptions,
): Promise<RawEpisode[]> {
	const end = offset + limit;
	const walk: IndexWalk = {
		end,
		skip: (shard, seen) => seen + shard.rows <= offset,
		rowsAfter: (shard, seen) => end - seen - shard.rows,
	};
	const collected: RawEpisode[] = [];
	for await (const indexFile of walkIndexFiles(toUrl, info, shards, walk, options)) {
		const rowStart = Math.max(0, offset - indexFile.seen);
		const rowEnd = Math.min(Number(indexFile.metadata.num_rows), end - indexFile.seen);
		if (rowStart < rowEnd) {
			for (const episode of await readIndexRows(info, indexFile, rowStart, rowEnd)) {
				collected.push(episode);
			}
		}
	}
	return collected;
}

/**
 * Finds the v3.0 index row whose `episode_index` is `index`, among the first `end`. Footer statistics
 * skip files and row groups; in one that may hold it, row `index - min` is tried before reading the
 * group's `episode_index` column.
 */
async function findEpisodeV3(
	toUrl: (path: string) => string,
	info: LeRobotInfo,
	index: number,
	end: number,
	shards: IndexShard[],
	options?: FetchOptions,
): Promise<{ raw: RawEpisode; position: number } | undefined> {
	const { compressors, parquetReadObjects } = await loadParquet();
	const walk: IndexWalk = {
		end,
		skip: (shard) => shard.lastIndex !== undefined && shard.lastIndex < index,
		/// Indexes ascend, so episode `index` is at most `index - lastIndex` rows past a file.
		rowsAfter: (shard, seen) =>
			Math.min(end - seen - shard.rows, shard.lastIndex === undefined ? Infinity : index - shard.lastIndex),
	};
	for await (const indexFile of walkIndexFiles(toUrl, info, shards, walk, options)) {
		const { file, metadata, seen } = indexFile;
		const readRow = async (row: number) => {
			const [raw] = await readIndexRows(info, indexFile, row, row + 1);
			return { raw, position: seen + row };
		};
		let groupEnd = 0;
		for (const group of metadata.row_groups) {
			const groupStart = groupEnd;
			groupEnd += Number(group.num_rows);
			const rowEnd = Math.min(groupEnd, end - seen);
			if (groupStart >= rowEnd) {
				break;
			}
			const statistics = columnStatistics(group, "episode_index");
			const min = toNumber(statistics?.min_value);
			const max = toNumber(statistics?.max_value);
			if (max !== undefined && max < index) {
				continue;
			}
			if (min !== undefined && min > index) {
				return undefined;
			}
			/// Without statistics, where it is when the whole index numbers episodes from 0 without gaps.
			const guess = min === undefined ? index - seen : groupStart + index - min;
			if (guess >= groupStart && guess < rowEnd) {
				const found = await readRow(guess);
				if (found.raw.index === index) {
					return found;
				}
			}
			const indexes = (
				await parquetReadObjects({
					file,
					metadata,
					columns: ["episode_index"],
					rowStart: groupStart,
					rowEnd,
					compressors,
				})
			).map((row) => toNumber(row.episode_index));
			const row = indexes.indexOf(index);
			if (row !== -1) {
				return readRow(groupStart + row);
			}
			/// Indexes ascend, so a row past `index` means no row holds it.
			if (indexes.some((value) => value !== undefined && value > index)) {
				return undefined;
			}
		}
	}
	return undefined;
}

export async function readEpisodes(
	info: LeRobotInfo,
	toUrl: (path: string) => string,
	offset: number,
	limit: number,
	indexShards: IndexShard[],
	options?: FetchOptions,
): Promise<LeRobotEpisode[]> {
	const raw =
		info.codebaseVersion === "v3.0"
			? await readEpisodesV3(toUrl, info, offset, limit, indexShards, options)
			: await readEpisodesV2(toUrl("meta/episodes.jsonl"), offset, limit, options);
	const built = raw.map((episode) => buildEpisode(episode, info, toUrl));
	/// After toFileRows, which reads episodes by position.
	const episodes = info.codebaseVersion === "v3.0" ? await toFileRows(built, offset, options) : built;
	return firstPerIndex(episodes);
}

/** The episode whose `episode_index` is `index`, or undefined when none of the first `info.totalEpisodes` has it. */
export async function readEpisode(
	info: LeRobotInfo,
	toUrl: (path: string) => string,
	index: number,
	indexShards: IndexShard[],
	options?: FetchOptions,
): Promise<LeRobotEpisode | undefined> {
	/// Indexes ascend, so episode `index` is at most at position `index`; past info.json's count is stale.
	const end = Math.min(index + 1, info.totalEpisodes);
	if (end <= 0) {
		return undefined;
	}
	if (info.codebaseVersion !== "v3.0") {
		/// A line at or past `index` ends the search, found or not.
		const lines = await readEpisodesV2(
			toUrl("meta/episodes.jsonl"),
			0,
			end,
			options,
			(episode) => episode.index >= index,
		);
		const raw = lines.find((episode) => episode.index === index);
		return raw === undefined ? undefined : buildEpisode(raw, info, toUrl);
	}
	const found = await findEpisodeV3(toUrl, info, index, end, indexShards, options);
	if (found === undefined) {
		return undefined;
	}
	const [episode] = await toFileRows([buildEpisode(found.raw, info, toUrl)], found.position, options);
	return episode;
}

/** The first row for an index a malformed dataset repeats (0, 1, 2, 0, 1, 2, ...). */
function firstPerIndex(episodes: LeRobotEpisode[]): LeRobotEpisode[] {
	const seen = new Set<number>();
	return episodes.filter((episode) => {
		if (seen.has(episode.index)) {
			return false;
		}
		seen.add(episode.index);
		return true;
	});
}

/** First `index` of a v3 data file, from the footer's statistics when present (files are in `index` order). */
async function readFileStart(url: string, options?: FetchOptions): Promise<number> {
	const { compressors, parquetMetadataAsync, parquetReadObjects } = await loadParquet();
	const file = await openRemoteFile(url, options);
	const metadata = await parquetMetadataAsync(file, { initialFetchSize: TAIL_PROBE_BYTES });
	let start = toNumber(columnStatistics(metadata.row_groups[0], "index")?.min_value);
	if (start === undefined) {
		const [first] = await parquetReadObjects({ file, metadata, columns: ["index"], rowEnd: 1, compressors });
		start = toNumber(first?.index);
	}
	if (start === undefined || !Number.isSafeInteger(start) || start < 0) {
		throw new Error(`Invalid first frame index in ${url}`);
	}
	return start;
}

/**
 * Turns v3's dataset-wide frame indexes into row offsets inside `data.url`. An episode in a different
 * file than the one before starts that file, so only files starting before the page need a read.
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
