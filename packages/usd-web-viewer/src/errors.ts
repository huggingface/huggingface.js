import type { UsdLoadErrorCode } from "./types.js";

/** Why a load failed: `aborted`, `fetch` (root layer or a resource limit), `compose`, `worker` or `webgl`. */
export class UsdLoadError extends Error {
	override readonly name = "UsdLoadError";
	readonly code: UsdLoadErrorCode;
	/** The URL that failed, when there is one. */
	declare readonly url?: string | undefined;
	/** HTTP status of a failed root layer fetch: 401 / 403 for gated or private repos, 404 when missing. */
	declare readonly status?: number | undefined;

	constructor(
		code: UsdLoadErrorCode,
		message: string,
		{ url, status, cause }: { url?: string | undefined; status?: number | undefined; cause?: unknown } = {},
	) {
		super(message, cause === undefined ? undefined : { cause });
		this.code = code;
		if (url !== undefined) {
			this.url = url;
		}
		if (status !== undefined) {
			this.status = status;
		}
	}
}
