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
	/** v3 index files walked so far, kept for the lifetime of this instance like `info()`. */
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
	 * Episodes in index order, normalized so v2 and v3 datasets look the same. Never more than
	 * `info.totalEpisodes`, and an episode index repeated within one call is returned once, as its first
	 * occurrence.
	 *
	 * Rejects when a `v3.0` index needs more files to reach the page than there are episodes up to its
	 * end (only empty index files do that), or more than 10,000 files.
	 *
	 * On v2.x the index is a JSON Lines file read from its start, so a deep `offset` downloads every line
	 * before it, and throws if that is more than 256 MiB.
	 */
	async episodes(options?: ListEpisodesOptions): Promise<LeRobotEpisode[]> {
		const info = await this.info();
		const offset = Math.max(0, Math.floor(options?.offset ?? 0));
		/// info.json is authoritative. A repo re-uploaded with fewer episodes can keep a stale index file
		/// after the current one, numbered from 0 again; reading past the count would return it.
		const limit = Math.min(
			Math.max(0, Math.floor(options?.limit ?? DEFAULT_EPISODE_LIMIT)),
			Math.max(0, info.totalEpisodes - offset),
		);
		/// Not `=== 0`: a NaN offset or limit makes `limit` NaN, which would read the whole v2 index.
		if (!(limit > 0)) {
			return [];
		}
		return readEpisodes(info, (path) => this.fileUrl(path), offset, limit, this.indexShards, this.fetchOptions);
	}

	/**
	 * The episode whose `episode_index` is `index`, or `undefined` when there is none. Unlike
	 * `episodes({ offset })`, which counts positions, this finds it in a dataset numbered from 10 or with
	 * gaps. When episodes are numbered 0, 1, 2, ... it costs the same as `episodes({ offset: index, limit: 1 })`.
	 *
	 * Rejects in the same cases as `episodes()`.
	 */
	async episode(index: number): Promise<LeRobotEpisode | undefined> {
		if (!Number.isSafeInteger(index) || index < 0) {
			return undefined;
		}
		return readEpisode(await this.info(), (path) => this.fileUrl(path), index, this.indexShards, this.fetchOptions);
	}

	/**
	 * One episode's frame rows, as a series per component. `undefined` when the episode's rows could
	 * not be located, which is what `episode.data` being absent means.
	 *
	 * ```ts
	 * const [episode] = await dataset.episodes({ limit: 1 });
	 * const frames = await dataset.frames(episode);
	 * frames?.series["observation.state"][0]; // shoulder_pan over time
	 * ```
	 */
	async frames(episode: LeRobotEpisode): Promise<LeRobotFrames | undefined> {
		return readFrames(await this.info(), episode, this.fetchOptions);
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
