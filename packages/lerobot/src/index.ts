import type { FetchOptions } from "./http";
import type { LeRobotEpisode, LeRobotFrames, LeRobotInfo } from "./types";

import { readEpisodes } from "./episodes";
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

	/** Episodes in index order, normalized so v2 and v3 datasets look the same. */
	async episodes(options?: ListEpisodesOptions): Promise<LeRobotEpisode[]> {
		const info = await this.info();
		const offset = Math.max(0, options?.offset ?? 0);
		const limit = Math.max(0, options?.limit ?? DEFAULT_EPISODE_LIMIT);
		if (limit === 0) {
			return [];
		}
		return readEpisodes(info, (path) => this.fileUrl(path), offset, limit, this.fetchOptions);
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
