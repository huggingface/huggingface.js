import type { FileMetaData, SchemaTree } from "hyparquet";
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

const NUMBER_TYPES = new Set(["BOOLEAN", "INT32", "INT64", "FLOAT", "DOUBLE"]);

function isNumberLeaf(node: SchemaTree | undefined): boolean {
	return node !== undefined && node.children.length === 0 && NUMBER_TYPES.has(node.element.type ?? "");
}

/**
 * The columns a series can come from (a number, or a list of numbers) among `features`, plus
 * `timestamp`. hyparquet decodes a nested column for its whole row group whatever rows are asked for,
 * so reading the others only to drop them can exhaust the heap: `language_*` annotations on a 900k-row
 * group take over 8 GB.
 */
function framesColumns(schema: SchemaTree, features?: string[]): string[] {
	return schema.children
		.filter(
			(column) =>
				features === undefined || column.element.name === "timestamp" || features.includes(column.element.name),
		)
		.filter((column) => {
			const [child] = column.children;
			const isSeries =
				isNumberLeaf(column) ||
				(column.children.length === 1 &&
					(isNumberLeaf(child) || (child.children.length === 1 && isNumberLeaf(child.children[0]))));
			return isSeries && (column.element.name === "timestamp" || !BOOKKEEPING_COLUMNS.has(column.element.name));
		})
		.map((column) => column.element.name);
}

/**
 * Compressed bytes of `columns` in the row groups holding rows `[rowStart, rowEnd)`. Without a page
 * index, which LeRobot does not write, hyparquet fetches those column chunks whole.
 */
function columnBytes(metadata: FileMetaData, columns: string[], rowStart: number, rowEnd: number): number {
	const wanted = new Set(columns);
	let bytes = 0;
	let groupEnd = 0;
	for (const group of metadata.row_groups) {
		const groupStart = groupEnd;
		groupEnd += Number(group.num_rows);
		if (groupStart >= rowEnd || groupEnd <= rowStart) {
			continue;
		}
		for (const chunk of group.columns) {
			if (chunk.meta_data && wanted.has(chunk.meta_data.path_in_schema[0])) {
				bytes += Number(chunk.meta_data.total_compressed_size);
			}
		}
	}
	return bytes;
}

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
	features?: string[],
	maxBytes?: number,
): Promise<LeRobotFrames | undefined> {
	if (!episode.data) {
		return undefined;
	}
	const { parquetMetadataAsync, parquetReadObjects, parquetSchema } = await loadHyparquet();
	const file = await openRemoteFile(episode.data.url, options);
	const metadata = await parquetMetadataAsync(file, { initialFetchSize: TAIL_PROBE_BYTES });
	const columns = framesColumns(parquetSchema(metadata), features);
	const { fromRow, toRow } = episode.data;
	if (maxBytes !== undefined && columnBytes(metadata, columns, fromRow, toRow) > maxBytes) {
		return undefined;
	}
	const rows = (await parquetReadObjects({
		file,
		metadata,
		columns,
		rowStart: fromRow,
		rowEnd: toRow,
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
