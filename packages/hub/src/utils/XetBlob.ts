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

interface ReconstructionInfo {
	/**
	 * List of CAS blocks
	 */
	terms: Array<{
		/** Hash of the CAS block */
		hash: string;
		/** Total uncompressed length of the CAS block */
		unpacked_length: number;
		/** Chunks. Eg start: 10, end: 100 = chunks 10-99 */
		range: { start: number; end: number };
	}>;

	/**
	 * Dictionnary of CAS block hash => list of ranges in the block + url to fetch it
	 */
	fetch_info: Record<
		string,
		Array<{
			url: string;
			/** Chunk range */
			range: { start: number; end: number };
			/** Byte range, when making the call to the URL */
			url_range: { start: number; end: number };
		}>
	>;
	/**
	 * When doing a range request, the offset into the first range
	 */
	offset_into_first_range: number;
}

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
	reconstructionInfo: ReconstructionInfo | undefined;

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

		if (slice.start !== this.start || slice.end !== this.end) {
			slice.reconstructionInfo = undefined;
		}

		return slice;
	}

	async #fetch(): Promise<ReadableStream<Uint8Array>> {
		let connParams = await getAccessToken(this.repoId, this.accessToken, this.fetch, this.hubUrl);

		let reconstructionInfo = this.reconstructionInfo;
		if (!reconstructionInfo) {
			// console.log(
			// 	`curl '${connParams.casUrl}/reconstruction/${this.hash}' -H 'Authorization: Bearer ${connParams.accessToken}'`
			// );
			const resp = await this.fetch(`${connParams.casUrl}/reconstruction/${this.hash}`, {
				headers: {
					Authorization: `Bearer ${connParams.accessToken}`,
					Range: `bytes=${this.start}-${this.end - 1}`,
				},
			});

			if (!resp.ok) {
				throw await createApiError(resp);
			}

			this.reconstructionInfo = reconstructionInfo = (await resp.json()) as ReconstructionInfo;
		}
		// todo: also refresh reconstruction info if it's expired, (and avoid concurrent requests when doing so)

		// Refetch the token if it's expired
		connParams = await getAccessToken(this.repoId, this.accessToken, this.fetch, this.hubUrl);

		async function* readData(reconstructionInfo: ReconstructionInfo, customFetch: typeof fetch) {
			for (const term of reconstructionInfo.terms) {
				const fetchInfo = reconstructionInfo.fetch_info[term.hash].find(
					(info) => info.range.start <= term.range.start && info.range.end >= term.range.end
				);

				if (!fetchInfo) {
					throw new Error(
						`Failed to find fetch info for term ${term.hash} and range ${term.range.start}-${term.range.end}`
					);
				}

				const resp = await customFetch(fetchInfo.url, {
					headers: {
						Range: `bytes=${fetchInfo.url_range.start}-${fetchInfo.url_range.end}`,
					},
				});

				if (!resp.ok) {
					throw await createApiError(resp);
				}

				const reader = resp.body?.getReader();
				if (!reader) {
					throw new Error("Failed to get reader from response body");
				}

				// todo: handle chunk ranges
				let done = false;
				let isFirstChunk = true;
				while (!done) {
					const { value, done: doneValue } = await reader.read();
					done = doneValue;
					if (value) {
						yield isFirstChunk ? value.slice(reconstructionInfo.offset_into_first_range) : value;
						isFirstChunk = false;
					}
				}
			}
		}

		const iterator = readData(reconstructionInfo, this.fetch);

		// todo: when Chrome/Safari support it, use ReadableStream.from(readData)
		return new ReadableStream<Uint8Array>(
			{
				// todo: when Safari supports it, type controller as ReadableByteStreamController
				async pull(controller) {
					const result = await iterator.next();

					if (result.value) {
						// Split into chunks of 1000 bytes since `ByteLengthQueuingStrategy` fails in Node.js due to size being a function
						const chunkSize = 1_000;
						for (let i = 0; i < result.value.length; i += chunkSize) {
							controller.enqueue(result.value.slice(i, i + chunkSize));
						}
					}

					if (result.done) {
						controller.close();
					}
				},
				type: "bytes",
				// todo: when Safari supports it, add autoAllocateChunkSize param
			},
			// todo : use ByteLengthQueuingStrategy when there's good support for it
			{
				highWaterMark: 1_000, // 1_000 chunks of 1_000 bytes, for 1MB of RAM
			}
		);
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

		const json: { accessToken: string; casUrl: string; exp: number } = await resp.json();
		const jwt = {
			repoId,
			accessToken: json.accessToken,
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

		return {
			accessToken: json.accessToken,
			casUrl: json.casUrl,
		};
	})();

	jwtPromises.set(repoId.name, promise);

	return promise;
}
