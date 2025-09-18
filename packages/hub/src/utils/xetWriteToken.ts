import { createApiError } from "../error";
import type { RepoId } from "../types/public";

export interface XetWriteTokenParams {
	accessToken: string | undefined;
	hubUrl: string;
	fetch?: typeof fetch;
	repo: RepoId;
	rev: string;
	isPullRequest?: boolean;
}

const JWT_SAFETY_PERIOD = 60_000;
const JWT_CACHE_SIZE = 1_000;

function cacheKey(params: Omit<XetWriteTokenParams, "fetch">): string {
	return JSON.stringify([params.hubUrl, params.repo, params.rev, params.accessToken, params.isPullRequest]);
}

const jwtPromises: Map<string, Promise<{ accessToken: string; casUrl: string }>> = new Map();
/**
 * Cache to store JWTs, to avoid making many auth requests when downloading multiple files from the same repo
 */
const jwts: Map<
	string,
	{
		accessToken: string;
		expiresAt: Date;
		casUrl: string;
	}
> = new Map();

export async function xetWriteToken(params: XetWriteTokenParams): Promise<{ accessToken: string; casUrl: string }> {
	const key = cacheKey(params);

	const jwt = jwts.get(key);

	if (jwt && jwt.expiresAt > new Date(Date.now() + JWT_SAFETY_PERIOD)) {
		return { accessToken: jwt.accessToken, casUrl: jwt.casUrl };
	}

	// If we already have a promise for this repo, return it
	const existingPromise = jwtPromises.get(key);
	if (existingPromise) {
		return existingPromise;
	}

	const promise = (async () => {
		const resp = await (params.fetch ?? fetch)(
			`${params.hubUrl}/api/${params.repo.type}s/${params.repo.name}/xet-write-token/${encodeURIComponent(
				params.rev
			)}` + (params.isPullRequest ? "?create_pr=1" : ""),
			{
				headers: params.accessToken
					? {
							Authorization: `Bearer ${params.accessToken}`,
					  }
					: {},
			}
		);

		if (!resp.ok) {
			throw await createApiError(resp);
		}

		const json: { accessToken: string; casUrl: string; exp: number } = await resp.json();
		const jwt = {
			accessToken: json.accessToken,
			expiresAt: new Date(json.exp * 1000),
			casUrl: json.casUrl,
		};

		jwtPromises.delete(key);

		for (const [key, value] of jwts.entries()) {
			if (value.expiresAt < new Date(Date.now() + JWT_SAFETY_PERIOD)) {
				jwts.delete(key);
			} else {
				break;
			}
		}
		if (jwts.size >= JWT_CACHE_SIZE) {
			const keyToDelete = jwts.keys().next().value;
			if (keyToDelete) {
				jwts.delete(keyToDelete);
			}
		}
		jwts.set(key, jwt);

		return {
			accessToken: json.accessToken,
			casUrl: json.casUrl,
		};
	})();

	jwtPromises.set(key, promise);

	return promise;
}
