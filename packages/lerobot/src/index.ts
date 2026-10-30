import type { IndexShard } from "./episodes";
import type { FetchOptions } from "./http";
import type { LeRobotEpisode, LeRobotFrames, LeRobotInfo } from "./types";

import { readEpisode, readEpisodes } from "./episodes";
import { readFrames } from "./frames";
import { fetchTextPrefix } from "./http";
import { MAX_INFO_BYTES, resolveUrl } from "./paths";
import { parseInfo } from "./info";

export const DEFAULT_ENDPOINT = "https://huggingface.co";
const DEFAULT_EPISODE_LIMIT = 10;

export interface LeRobotDatasetOptions extends FetchOptions {
	/** Branch, tag or commit sha. Prefer a sha when the result is cached anywhere. */
	revision?: string;
	endpoint?: string;
}

export interface ListEpisodesOptions {
	/** Position in the index, which is not the `episode_index` once a dataset skips one; see `episode()`. */
	offset?: number;
	limit?: number;
}

export interface ReadFramesOptions {
	/** Only these features, such as `["observation.state", "action"]`. Every numeric one by default. */
	features?: string[];
	/** Resolve `undefined` rather than download more than this; a data file's columns are read whole. */
	maxBytes?: number;
}

/**
 * A LeRobot dataset on the Hub, read over ranged HTTP requests.
 *
 * ```ts
 * const dataset = new LeRobotDataset("lerobot/svla_so101_pickplace");
 * const info = await dataset.info();
 * const episodes = await dataset.episodes({ limit: 10 });
 * ```
 */
export class LeRobotDataset {
	private readonly endpoint: string;
	private readonly revision: string;
	private readonly fetchOptions: FetchOptions;
	private infoPromise?: Promise<LeRobotInfo>;
	/** v3 index files walked so far, reused by later calls. */
	private readonly indexShards: IndexShard[] = [];

	constructor(
		public readonly repoId: string,
		options?: LeRobotDatasetOptions,
	) {
		this.endpoint = (options?.endpoint ?? DEFAULT_ENDPOINT).replace(/\/+$/, "");
		this.revision = options?.revision ?? "main";
		this.fetchOptions = { fetch: options?.fetch, additionalFetchHeaders: options?.additionalFetchHeaders };
	}

	/** Absolute `/resolve/` URL for a path inside the repo. */
	fileUrl(path: string): string {
		return resolveUrl(this.endpoint, this.repoId, this.revision, path);
	}

	/** Parsed `meta/info.json`. Memoized for the lifetime of this instance. */
	info(): Promise<LeRobotInfo> {
		this.infoPromise ??= fetchTextPrefix(this.fileUrl("meta/info.json"), MAX_INFO_BYTES, this.fetchOptions).then(
			({ text }) => parseInfo(text),
		);
		return this.infoPromise;
	}

	/**
	 * Episodes in index order, the same shape for v2 and v3. Never more than `info.totalEpisodes`; an index
	 * repeated within one call is returned once.
	 *
	 * Rejects past 10,000 v3 index files, or when empty ones hold fewer episodes than the page needs. On
	 * v2.x a deep `offset` reads the index from its start, and rejects past 256 MiB.
	 */
	async episodes(options?: ListEpisodesOptions): Promise<LeRobotEpisode[]> {
		const info = await this.info();
		const offset = Math.max(0, Math.floor(options?.offset ?? 0));
		/// info.json's count wins: a re-upload with fewer episodes can leave a stale index file behind.
		const limit = Math.min(
			Math.max(0, Math.floor(options?.limit ?? DEFAULT_EPISODE_LIMIT)),
			Math.max(0, info.totalEpisodes - offset),
		);
		/// Not `=== 0`: a NaN offset or limit would read the whole v2 index.
		if (!(limit > 0)) {
			return [];
		}
		return readEpisodes(info, (path) => this.fileUrl(path), offset, limit, this.indexShards, this.fetchOptions);
	}

	/**
	 * The episode whose `episode_index` is `index`, or `undefined`. Unlike `episodes({ offset })`, which
	 * counts positions, this handles datasets numbered from 10 or with gaps. Rejects like `episodes()`.
	 */
	async episode(index: number): Promise<LeRobotEpisode | undefined> {
		if (!Number.isSafeInteger(index) || index < 0) {
			return undefined;
		}
		return readEpisode(await this.info(), (path) => this.fileUrl(path), index, this.indexShards, this.fetchOptions);
	}

	/**
	 * One episode's frame rows, as a series per component. `undefined` when `episode.data` is absent, or
	 * reading would cost more than `maxBytes`.
	 *
	 * ```ts
	 * const [episode] = await dataset.episodes({ limit: 1 });
	 * const frames = await dataset.frames(episode);
	 * frames?.series["observation.state"][0]; // shoulder_pan over time
	 * ```
	 */
	async frames(episode: LeRobotEpisode, options?: ReadFramesOptions): Promise<LeRobotFrames | undefined> {
		return readFrames(await this.info(), episode, this.fetchOptions, options?.features, options?.maxBytes);
	}
}

export { parseInfo } from "./info";
export { formatPathTemplate, isSafeRepoPath, MAX_INFO_BYTES, resolveUrl } from "./paths";
export { episodesMetadataPath } from "./episodes";
export { fetchRange, fetchTextPrefix, HttpError, openRemoteFile } from "./http";
export type { FetchOptions, RandomAccessFile, RangeResult, TextPrefix } from "./http";
export type {
	LeRobotCamera,
	LeRobotCodebaseVersion,
	LeRobotEpisode,
	LeRobotEpisodeData,
	LeRobotEpisodeVideo,
	LeRobotFrames,
	LeRobotInfo,
} from "./types";
