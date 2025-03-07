import { HUB_URL } from "../consts";
import type { CredentialsParams, RepoDesignation, RepoId } from "../types/public";
import { checkCredentials } from "./checkCredentials";
import { toRepoId } from "./toRepoId";

const JWT_SAFETY_PERIOD = 60_000;
const JWT_CACHE_SIZE = 1_000;

type XetBlobCreateOptions = {
	/**
	 * Custom fetch function to use instead of the default one, for example to use a proxy or edit headers.
	 */
	fetch?: typeof fetch;
	repo: RepoDesignation;
	hash: string;
	hubUrl?: string;
} & Partial<CredentialsParams>;

/**
 * XetBlob is a blob implementation that fetches data directly from the Xet storage
 */
export class XetBlob extends Blob {
	fetch: typeof fetch;
	accessToken?: string;
	repoId: RepoId;
	hubUrl: string;

	constructor(params: XetBlobCreateOptions) {
		super([]);

		this.fetch = params.fetch ?? fetch;
		this.accessToken = checkCredentials(params);
		this.repoId = toRepoId(params.repo);
		this.hubUrl = params.hubUrl ?? HUB_URL;
	}
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

function cacheKey(params: { repoId: RepoId; initialAccessToken: string | undefined }): string {
	return `${params.repoId.type}:${params.repoId.name}:${params.initialAccessToken}`;
}

async function getAccessToken(
	repoId: RepoId,
	initialAccessToken: string | undefined,
	customFetch: typeof fetch,
	hubUrl: string
): Promise<{ accessToken: string; casUrl: string }> {
	const key = cacheKey({ repoId, initialAccessToken });

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
		const url = `${hubUrl}/api/${repoId.type}s/${repoId.name}/xet-read-token/main`;
		const resp = await customFetch(url, {
			headers: {
				...(initialAccessToken
					? {
							Authorization: `Bearer ${initialAccessToken}`,
					  }
					: {}),
			},
		});

		if (!resp.ok) {
			throw new Error(`Failed to get JWT token: ${resp.status} ${await resp.text()}`);
		}

		const json = await resp.json();
		const jwt = {
			repoId,
			accessToken: json.token,
			expiresAt: new Date(json.exp * 1000),
			initialAccessToken,
			hubUrl,
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

		return jwt.accessToken;
	})();

	jwtPromises.set(repoId.name, promise);

	return promise;
}
