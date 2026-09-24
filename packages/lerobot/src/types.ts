/** Dataset layout versions understood by this package. */
export type LeRobotCodebaseVersion = "v2.0" | "v2.1" | "v3.0";

export interface LeRobotCamera {
	/** Feature key, e.g. `observation.images.up`. Also the `video_key` used in `video_path`. */
	key: string;
	width: number;
	height: number;
	/** As written by LeRobot (`av1`, `h264`, ...), when the dataset declares it. */
	codec?: string;
}

/** Normalized view of `meta/info.json`. */
export interface LeRobotInfo {
	codebaseVersion: LeRobotCodebaseVersion;
	/** Raw `robot_type`; `unknown`, blank and implausibly long values are dropped. */
	robotType?: string;
	fps: number;
	totalEpisodes: number;
	totalFrames?: number;
	totalTasks?: number;
	/** Episodes per chunk directory; drives v2 path arithmetic. */
	chunksSize: number;
	/** Raw python-format template, e.g. `data/chunk-{chunk_index:03d}/file-{file_index:03d}.parquet`. */
	dataPath: string;
	/** Absent for image-only datasets. */
	videoPath?: string;
	cameras: LeRobotCamera[];
	/** Feature key -> joint names, e.g. `observation.state` -> `["shoulder_pan.pos", ...]`. */
	joints: Record<string, string[]>;
}

export interface LeRobotEpisodeVideo {
	cameraKey: string;
	url: string;
	/** Offset of this episode inside `url`. Always 0 when each episode has its own file (v2). */
	fromSec: number;
	toSec: number;
}

/** Where an episode's frame rows live, for callers that want to chart them. */
/** An episode's frame rows, read from the parquet file its `data` points at. */
export interface LeRobotFrames {
	/** Number of frames read. */
	length: number;
	/** Seconds from the start of the episode, one per frame. */
	timestamps: number[];
	/**
	 * Feature key -> one series per component, e.g. `observation.state` -> an array per motor, each
	 * `length` long. Only columns that hold a numeric array per row are included.
	 */
	series: Record<string, number[][]>;
	/** Feature key -> component names, for the features whose `info.json` entry declares them. */
	names: Record<string, string[]>;
}

export interface LeRobotEpisodeData {
	url: string;
	/** Inclusive row offset inside `url`, not a dataset-wide frame index. */
	fromRow: number;
	/** Exclusive row offset inside `url`. */
	toRow: number;
}

/**
 * One episode, normalized so that v2 and v3 datasets are indistinguishable to callers.
 */
export interface LeRobotEpisode {
	index: number;
	/** Number of frames. */
	length: number;
	durationSec: number;
	tasks: string[];
	videos: LeRobotEpisodeVideo[];
	/** Absent when the episode's rows inside its v3 data file could not be located. */
	data?: LeRobotEpisodeData;
}
