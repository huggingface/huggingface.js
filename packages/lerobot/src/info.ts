import type { LeRobotCamera, LeRobotCodebaseVersion, LeRobotInfo } from "./types";

import { MAX_PATH_TEMPLATE_LENGTH } from "./paths";

const SUPPORTED_VERSIONS: LeRobotCodebaseVersion[] = ["v2.0", "v2.1", "v3.0"];
const DEFAULT_CHUNKS_SIZE = 1_000;
/**
 * `meta/info.json` is user-authored and callers render these strings, so each is bounded. Real
 * values are a few dozen characters at most; anything longer is dropped rather than truncated.
 */
const MAX_FEATURE_KEY_LENGTH = 200;
const MAX_ROBOT_TYPE_LENGTH = 100;
const MAX_CODEC_LENGTH = 32;
/**
 * Counts are bounded too: each camera yields a formatted URL per episode, so the per-path cap alone
 * would not bound a listing. Real datasets have a handful of cameras and joint features.
 */
const MAX_CAMERAS = 32;
const MAX_JOINT_FEATURES = 64;
/** A feature with more names is dropped rather than truncated, which would mislabel its dimensions. */
const MAX_JOINT_NAMES = 256;

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asFiniteNumber(value: unknown): number | undefined {
	return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function asNonEmptyString(value: unknown, maxLength = Infinity): string | undefined {
	if (typeof value !== "string") {
		return undefined;
	}
	const trimmed = value.trim();
	return trimmed.length > 0 && trimmed.length <= maxLength ? trimmed : undefined;
}

function asPositiveInteger(value: unknown): number | undefined {
	return typeof value === "number" && Number.isSafeInteger(value) && value > 0 ? value : undefined;
}

function asStringArray(value: unknown): string[] | undefined {
	if (!Array.isArray(value) || value.length === 0 || !value.every((item) => typeof item === "string")) {
		return undefined;
	}
	return value;
}

function isSupportedVersion(value: unknown): value is LeRobotCodebaseVersion {
	return typeof value === "string" && SUPPORTED_VERSIONS.includes(value as LeRobotCodebaseVersion);
}

/**
 * LeRobot has written the per-camera video metadata under two different keys across releases:
 * `info` (v2.x and early v3) and `video_info` (later v3). Both carry `video.codec`.
 */
function readCodec(feature: Record<string, unknown>): string | undefined {
	for (const key of ["info", "video_info"]) {
		const block = feature[key];
		if (isRecord(block)) {
			const codec = asNonEmptyString(block["video.codec"], MAX_CODEC_LENGTH);
			if (codec !== undefined) {
				return codec;
			}
		}
	}
	return undefined;
}

/** `shape` is `[height, width, channels]`. */
function readCamera(key: string, feature: Record<string, unknown>): LeRobotCamera | undefined {
	const shape = feature.shape;
	if (!Array.isArray(shape) || shape.length < 2) {
		return undefined;
	}
	const height = asFiniteNumber(shape[0]);
	const width = asFiniteNumber(shape[1]);
	if (height === undefined || width === undefined) {
		return undefined;
	}
	return { key, height, width, codec: readCodec(feature) };
}

/**
 * `names` is usually a flat list of joint names, but some datasets nest it under a single key
 * such as `{ motors: [...] }`.
 */
function readJointNames(feature: Record<string, unknown>): string[] | undefined {
	const names = feature.names;
	let list = asStringArray(names);
	if (list === undefined && isRecord(names)) {
		for (const nested of Object.values(names)) {
			list = asStringArray(nested);
			if (list !== undefined) {
				break;
			}
		}
	}
	if (
		list === undefined ||
		list.length > MAX_JOINT_NAMES ||
		list.some((name) => name.length > MAX_FEATURE_KEY_LENGTH)
	) {
		return undefined;
	}
	return list;
}

/**
 * Parses the contents of `meta/info.json`.
 *
 * Throws when the input is not a usable LeRobot info file, which includes an LFS pointer, a
 * truncated blob, or a dataset whose `codebase_version` this package does not implement.
 */
export function parseInfo(text: string): LeRobotInfo {
	let json: unknown;
	try {
		json = JSON.parse(text);
	} catch {
		throw new Error("meta/info.json is not valid JSON (an LFS pointer or a truncated read?)");
	}
	if (!isRecord(json)) {
		throw new Error("meta/info.json is not an object");
	}

	const codebaseVersion = json.codebase_version;
	if (!isSupportedVersion(codebaseVersion)) {
		throw new Error(
			`Unsupported codebase_version ${JSON.stringify(codebaseVersion)}; expected one of ${SUPPORTED_VERSIONS.join(", ")}`,
		);
	}

	const totalEpisodes = asFiniteNumber(json.total_episodes);
	if (totalEpisodes === undefined || totalEpisodes < 0) {
		throw new Error("meta/info.json is missing a valid total_episodes");
	}
	const fps = asFiniteNumber(json.fps);
	if (fps === undefined || fps <= 0) {
		throw new Error("meta/info.json is missing a valid fps");
	}
	const dataPath = asNonEmptyString(json.data_path, MAX_PATH_TEMPLATE_LENGTH);
	if (dataPath === undefined) {
		throw new Error("meta/info.json is missing a valid data_path");
	}

	const cameras: LeRobotCamera[] = [];
	/// Collected as entries so that a `__proto__` feature key stays an own property
	const joints: [string, string[]][] = [];
	const features = json.features;
	if (isRecord(features)) {
		for (const [key, rawFeature] of Object.entries(features)) {
			if (!isRecord(rawFeature) || key.length > MAX_FEATURE_KEY_LENGTH) {
				continue;
			}
			if (rawFeature.dtype === "video") {
				if (cameras.length >= MAX_CAMERAS) {
					continue;
				}
				const camera = readCamera(key, rawFeature);
				if (camera !== undefined) {
					cameras.push(camera);
				}
				continue;
			}
			if (joints.length >= MAX_JOINT_FEATURES) {
				continue;
			}
			const names = readJointNames(rawFeature);
			if (names !== undefined) {
				joints.push([key, names]);
			}
		}
	}

	const robotType = asNonEmptyString(json.robot_type, MAX_ROBOT_TYPE_LENGTH);

	return {
		codebaseVersion,
		robotType: robotType !== undefined && robotType.toLowerCase() !== "unknown" ? robotType : undefined,
		fps,
		totalEpisodes,
		totalFrames: asFiniteNumber(json.total_frames),
		totalTasks: asFiniteNumber(json.total_tasks),
		chunksSize: asPositiveInteger(json.chunks_size) ?? DEFAULT_CHUNKS_SIZE,
		dataPath,
		videoPath: asNonEmptyString(json.video_path, MAX_PATH_TEMPLATE_LENGTH),
		cameras,
		joints: Object.fromEntries(joints),
	};
}
