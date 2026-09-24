import type { FetchOptions } from "./http";
import type { LeRobotEpisode, LeRobotFrames, LeRobotInfo } from "./types";

import { openRemoteFile } from "./http";

/**
 * hyparquet is a hard dependency but is still loaded on demand, so a caller that only reads `info()`
 * never pays for the parquet reader.
 */
async function loadHyparquet() {
	return import("hyparquet");
}

/** Rows carry `bigint` for integer columns, and `null` wherever the dataset has a gap. */
function toNumber(value: unknown): number | undefined {
	if (typeof value === "number") {
		return Number.isFinite(value) ? value : undefined;
	}
	if (typeof value === "bigint") {
		return Number(value);
	}
	return undefined;
}

/**
 * A column holds one series per component when every row is a numeric array of the same width, which
 * is how LeRobot stores `observation.state`, `action` and the rest of the motor features.
 */
function seriesWidth(rows: Record<string, unknown>[], key: string): number | undefined {
	const first = rows[0]?.[key];
	if (!Array.isArray(first) || first.length === 0) {
		return undefined;
	}
	return toNumber(first[0]) === undefined ? undefined : first.length;
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
	const metadata = await parquetMetadataAsync(file);
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
		const width = seriesWidth(rows, key);
		if (width === undefined) {
			continue;
		}
		/// One array per component rather than one per row: a chart plots a component over time.
		const components: number[][] = Array.from({ length: width }, () => []);
		for (const row of rows) {
			const value = row[key];
			for (let i = 0; i < width; i++) {
				components[i].push(toNumber(Array.isArray(value) ? value[i] : undefined) ?? NaN);
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
