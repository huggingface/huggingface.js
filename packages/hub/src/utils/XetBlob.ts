import { HUB_URL } from "../consts";
import { createApiError } from "../error";
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
	size: number;
} & Partial<CredentialsParams>;

/**
 * XetBlob is a blob implementation that fetches data directly from the Xet storage
 */
export class XetBlob extends Blob {
	fetch: typeof fetch;
	accessToken?: string;
	repoId: RepoId;
	hubUrl: string;
	hash: string;
	start = 0;
	end = 0;
	reconstructionInfo: { terms: unknown[]; fetch_info: unknown } | undefined;

	constructor(params: XetBlobCreateOptions) {
		super([]);

		this.fetch = params.fetch ?? fetch;
		this.accessToken = checkCredentials(params);
		this.repoId = toRepoId(params.repo);
		this.hubUrl = params.hubUrl ?? HUB_URL;
		this.end = params.size;
		this.hash = params.hash;
		this.hubUrl;
	}

	override get size(): number {
		return this.end - this.start;
	}

	#clone() {
		const blob = new XetBlob({
			fetch: this.fetch,
			repo: this.repoId,
			hash: this.hash,
			hubUrl: this.hubUrl,
			size: this.size,
		});

		blob.accessToken = this.accessToken;
		blob.start = this.start;
		blob.end = this.end;
		blob.reconstructionInfo = this.reconstructionInfo;

		return blob;
	}

	override slice(start = 0, end = this.size): XetBlob {
		if (start < 0 || end < 0) {
			new TypeError("Unsupported negative start/end on XetBlob.slice");
		}

		const slice = this.#clone();
		slice.start = this.start + start;
		slice.end = Math.min(this.start + end, this.end);

		return slice;
	}

	async #fetch(): Promise<ReadableStream<Uint8Array>> {
		let connParams = await getAccessToken(this.repoId, this.accessToken, this.fetch, this.hubUrl);

		if (!this.reconstructionInfo) {
			const resp = await this.fetch(`${connParams.casUrl}/reconstruction/${this.hash}`, {
				headers: {
					Authorization: `Bearer ${connParams.accessToken}`,
				},
			});

			if (!resp.ok) {
				throw await createApiError(resp);
			}

			this.reconstructionInfo = await resp.json();
			console.log("reconstruction info", this.reconstructionInfo);
		}

		// Refetch the token if it's expired
		connParams = await getAccessToken(this.repoId, this.accessToken, this.fetch, this.hubUrl);

		throw new Error("Reconstruction not implemented: " + JSON.stringify(this.reconstructionInfo));
	}

	override async arrayBuffer(): Promise<ArrayBuffer> {
		const result = await this.#fetch();

		return new Response(result).arrayBuffer();
	}

	override async text(): Promise<string> {
		const result = await this.#fetch();

		return new Response(result).text();
	}

	async response(): Promise<Response> {
		const result = await this.#fetch();

		return new Response(result);
	}

	override stream(): ReturnType<Blob["stream"]> {
		const stream = new TransformStream();

		this.#fetch()
			.then((response) => response.pipeThrough(stream))
			.catch((error) => stream.writable.abort(error.message));

		return stream.readable;
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
