import type { FetchOptions } from "./http";
import type { LeRobotEpisode, LeRobotFrames, LeRobotInfo } from "./types";

import { openRemoteFile, TAIL_PROBE_BYTES } from "./http";

/**
 * hyparquet is a hard dependency but is still loaded on demand, so a caller that only reads `info()`
 * never pays for the parquet reader.
 */
async function loadHyparquet() {
	return import("hyparquet");
}

/** LeRobot writes these on every dataset to locate a frame; they are not signals to chart. */
const BOOKKEEPING_COLUMNS = new Set(["timestamp", "frame_index", "episode_index", "index", "task_index"]);

/** Rows carry `bigint` for integer columns, and `null` wherever the dataset has a gap. */
function toNumber(value: unknown): number | undefined {
	if (typeof value === "boolean") {
		return value ? 1 : 0;
	}
	if (typeof value === "number") {
		return Number.isFinite(value) ? value : undefined;
	}
	if (typeof value === "bigint") {
		return Number(value);
	}
	return undefined;
}

/**
 * Components per row: the array width for `observation.state`, `action` and the rest of the motor
 * features, 1 for a scalar such as a reward or a success flag. Undefined for anything else.
 */
function seriesWidth(rows: Record<string, unknown>[], key: string): number | undefined {
	const first = rows[0]?.[key];
	if (Array.isArray(first)) {
		return first.length > 0 && toNumber(first[0]) !== undefined ? first.length : undefined;
	}
	return toNumber(first) === undefined ? undefined : 1;
}

export async function readFrames(
	info: LeRobotInfo,
	episode: LeRobotEpisode,
	options?: FetchOptions,
): Promise<LeRobotFrames | undefined> {
	if (!episode.data) {
		return undefined;
	}
	const { parquetMetadataAsync, parquetReadObjects } = await loadHyparquet();
	const file = await openRemoteFile(episode.data.url, options);
	const metadata = await parquetMetadataAsync(file, { initialFetchSize: TAIL_PROBE_BYTES });
	const rows = (await parquetReadObjects({
		file,
		metadata,
		rowStart: episode.data.fromRow,
		rowEnd: episode.data.toRow,
	})) as Record<string, unknown>[];

	if (rows.length === 0) {
		return undefined;
	}

	const series: Record<string, number[][]> = {};
	for (const key of Object.keys(rows[0])) {
		if (BOOKKEEPING_COLUMNS.has(key)) {
			continue;
		}
		const width = seriesWidth(rows, key);
		if (width === undefined) {
			continue;
		}
		/// One array per component rather than one per row: a chart plots a component over time.
		const components: number[][] = Array.from({ length: width }, () => []);
		for (const row of rows) {
			const value = row[key];
			for (let i = 0; i < width; i++) {
				components[i].push(toNumber(Array.isArray(value) ? value[i] : value) ?? NaN);
			}
		}
		series[key] = components;
	}

	/// `timestamp` is seconds from the start of the episode on both layouts; the frame index is the
	/// fallback for a dataset that omits it.
	const timestamps = rows.map((row, index) => toNumber(row.timestamp) ?? (info.fps > 0 ? index / info.fps : index));

	return {
		length: rows.length,
		timestamps,
		series,
		names: Object.fromEntries(
			Object.keys(series)
				.map((key) => [key, info.joints[key]] as const)
				.filter((entry): entry is readonly [string, string[]] => entry[1] !== undefined),
		),
	};
}
