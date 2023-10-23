import { isFrontend, base64FromBytes } from "../../../shared";
import { HUB_URL } from "../consts";
import { HubApiError, createApiError, InvalidApiResponseFormatError } from "../error";
import type {
	ApiCommitHeader,
	ApiCommitLfsFile,
	ApiCommitOperation,
	ApiLfsBatchRequest,
	ApiLfsBatchResponse,
	ApiLfsCompleteMultipartRequest,
	ApiPreuploadRequest,
	ApiPreuploadResponse,
} from "../types/api/api-commit";
import type { Credentials, RepoDesignation } from "../types/public";
import { checkCredentials } from "../utils/checkCredentials";
import { chunk } from "../utils/chunk";
import { promisesQueue } from "../utils/promisesQueue";
import { promisesQueueStreaming } from "../utils/promisesQueueStreaming";
import { sha256 } from "../utils/sha256";
import { toRepoId } from "../utils/toRepoId";
import { WebBlob } from "../utils/WebBlob";
import { createBlob } from "../utils/createBlob";
import { eventToGenerator } from "../utils/eventToGenerator";

const CONCURRENT_SHAS = 5;
const CONCURRENT_LFS_UPLOADS = 5;
const MULTIPART_PARALLEL_UPLOAD = 5;

export interface CommitDeletedEntry {
	operation: "delete";
	path: string;
}

export type ContentSource = Blob | URL;

export interface CommitFile {
	operation: "addOrUpdate";
	path: string;
	content: ContentSource;
	// forceLfs?: boolean
}

type CommitBlob = Omit<CommitFile, "content"> & { content: Blob };

// TODO: find a nice way to handle LFS & non-LFS files in an uniform manner, see https://github.com/huggingface/moon-landing/issues/4370
// export type CommitRenameFile = {
// 	operation: "rename";
// 	path:      string;
// 	oldPath:   string;
// 	content?:  ContentSource;
// };

export type CommitOperation = CommitDeletedEntry | CommitFile /* | CommitRenameFile */;
type CommitBlobOperation = Exclude<CommitOperation, CommitFile> | CommitBlob;

export interface CommitParams {
	title: string;
	description?: string;
	repo: RepoDesignation;
	operations: CommitOperation[];
	credentials?: Credentials;
	/** @default "main" */
	branch?: string;
	/**
	 * Parent commit. Optional
	 *
	 * - When opening a PR: will use parentCommit as the parent commit
	 * - When committing on a branch: Will make sure that there were no intermediate commits
	 */
	parentCommit?: string;
	isPullRequest?: boolean;
	hubUrl?: string;
	/**
	 * Whether to use web workers to compute SHA256 hashes.
	 *
	 * We load hash-wasm from a CDN inside the web worker. Not sure how to do otherwise and still have a "clean" bundle.
	 */
	useWebWorkers?: boolean | { minSize: number };
	/**
	 * Custom fetch function to use instead of the default one, for example to use a proxy or edit headers.
	 */
	fetch?: typeof fetch;
}

export interface CommitOutput {
	pullRequestUrl?: string;
	commit: {
		oid: string;
		url: string;
	};
	hookOutput: string;
}

function isFileOperation(op: CommitOperation): op is CommitBlob {
	const ret = op.operation === "addOrUpdate";

	if (ret && !(op.content instanceof Blob)) {
		throw new TypeError("Precondition failed: op.content should be a Blob");
	}

	return ret;
}

export type CommitProgressEvent =
	| {
			event: "phase";
			phase: "preuploading" | "uploadingLargeFiles" | "committing";
	  }
	| {
			event: "progress";
			progress: number;
	  }
	| {
			event: "fileProgress";
			path: string;
			progress: number;
			type: "hashing" | "uploading";
	  };

/**
 * Internal function for now, used by commit.
 *
 * Can be exposed later to offer fine-tuned progress info
 */
export async function* commitIter(params: CommitParams): AsyncGenerator<CommitProgressEvent, CommitOutput> {
	checkCredentials(params.credentials);
	const repoId = toRepoId(params.repo);
	yield { event: "phase", phase: "preuploading" };

	const lfsShas = new Map<string, string | null>();

	const allOperations = await Promise.all(
		params.operations.map(async (operation) => {
			if (operation.operation !== "addOrUpdate") {
				return operation;
			}

			if (!(operation.content instanceof URL)) {
				/** TS trick to enforce `content` to be a `Blob` */
				return { ...operation, content: operation.content };
			}

			const lazyBlob = await createBlob(operation.content, { fetch: params.fetch });

			return {
				...operation,
				content: lazyBlob,
			};
		})
	);

	const gitAttributes = allOperations.filter(isFileOperation).find((op) => op.path === ".gitattributes")?.content;

	for (const operations of chunk(allOperations.filter(isFileOperation), 100)) {
		const payload: ApiPreuploadRequest = {
			gitAttributes: gitAttributes && (await gitAttributes.text()),
			files: await Promise.all(
				operations.map(async (operation) => ({
					path: operation.path,
					size: operation.content.size,
					sample: base64FromBytes(new Uint8Array(await operation.content.slice(0, 512).arrayBuffer())),
				}))
			),
		};

		const res = await (params.fetch ?? fetch)(
			`${params.hubUrl ?? HUB_URL}/api/${repoId.type}s/${repoId.name}/preupload/${encodeURIComponent(
				params.branch ?? "main"
			)}` + (params.isPullRequest ? "?create_pr=1" : ""),
			{
				method: "POST",
				headers: {
					...(params.credentials && { Authorization: `Bearer ${params.credentials.accessToken}` }),
					"Content-Type": "application/json",
				},
				body: JSON.stringify(payload),
			}
		);

		if (!res.ok) {
			throw await createApiError(res);
		}

		const json: ApiPreuploadResponse = await res.json();

		for (const file of json.files) {
			if (file.uploadMode === "lfs") {
				lfsShas.set(file.path, null);
			}
		}
	}

	yield { event: "phase", phase: "uploadingLargeFiles" };

	for (const operations of chunk(
		allOperations.filter(isFileOperation).filter((op) => lfsShas.has(op.path)),
		100
	)) {
		const shas = yield* eventToGenerator<
			{ event: "fileProgress"; type: "hashing"; path: string; progress: number },
			string[]
		>((yieldCallback, returnCallback, rejectCallack) => {
			promisesQueue(
				operations.map((op) => async () => {
					const iterator = sha256(op.content, { useWebWorker: params.useWebWorkers });
					let res: IteratorResult<number, string>;
					do {
						res = await iterator.next();
						const progress = res.done ? 1 : res.value;
						yieldCallback({ event: "fileProgress", path: op.path, progress, type: "hashing" });
					} while (!res.done);
					const sha = res.value;
					lfsShas.set(op.path, res.value);
					return sha;
				}),
				CONCURRENT_SHAS
			).then(returnCallback, rejectCallack);
		});

		const payload: ApiLfsBatchRequest = {
			operation: "upload",
			// multipart is a custom protocol for HF
			transfers: ["basic", "multipart"],
			hash_algo: "sha_256",
			ref: {
				name: params.branch ?? "main",
			},
			objects: operations.map((op, i) => ({
				oid: shas[i],
				size: op.content.size,
			})),
		};

		const res = await (params.fetch ?? fetch)(
			`${params.hubUrl ?? HUB_URL}/${repoId.type === "model" ? "" : repoId.type + "s/"}${
				repoId.name
			}.git/info/lfs/objects/batch`,
			{
				method: "POST",
				headers: {
					...(params.credentials && { Authorization: `Bearer ${params.credentials.accessToken}` }),
					Accept: "application/vnd.git-lfs+json",
					"Content-Type": "application/vnd.git-lfs+json",
				},
				body: JSON.stringify(payload),
			}
		);

		if (!res.ok) {
			throw await createApiError(res);
		}

		const json: ApiLfsBatchResponse = await res.json();
		const batchRequestId = res.headers.get("X-Request-Id") || undefined;

		const shaToOperation = new Map(operations.map((op, i) => [shas[i], op]));

		await promisesQueueStreaming(
			json.objects.map((obj) => async () => {
				const op = shaToOperation.get(obj.oid);

				if (!op) {
					throw new InvalidApiResponseFormatError("Unrequested object ID in response");
				}

				if (obj.error) {
					const errorMessage = `Error while doing LFS batch call for ${operations[shas.indexOf(obj.oid)].path}: ${
						obj.error.message
					}${batchRequestId ? ` - Request ID: ${batchRequestId}` : ""}`;
					throw new HubApiError(res.url, obj.error.code, batchRequestId, errorMessage);
				}
				if (!obj.actions?.upload) {
					return;
				}
				const content = op.content;
				const header = obj.actions.upload.header;
				if (header?.chunk_size) {
					const chunkSize = parseInt(header.chunk_size);

					// multipart upload
					// parts are in upload.header['00001'] to upload.header['99999']

					const completionUrl = obj.actions.upload.href;
					const parts = Object.keys(header).filter((key) => /^[0-9]+$/.test(key));

					if (parts.length !== Math.ceil(content.size / chunkSize)) {
						throw new Error("Invalid server response to upload large LFS file, wrong number of parts");
					}

					const completeReq: ApiLfsCompleteMultipartRequest = {
						oid: obj.oid,
						parts: parts.map((part) => ({
							partNumber: +part,
							etag: "",
						})),
					};

					await promisesQueueStreaming(
						parts.map((part) => async () => {
							const index = parseInt(part) - 1;
							const slice = content.slice(index * chunkSize, (index + 1) * chunkSize);

							const res = await (params.fetch ?? fetch)(header[part], {
								method: "PUT",
								/** Unfortunately, browsers don't support our inherited version of Blob in fetch calls */
								body: slice instanceof WebBlob && isFrontend ? await slice.arrayBuffer() : slice,
							});

							if (!res.ok) {
								throw await createApiError(res, {
									requestId: batchRequestId,
									message: `Error while uploading part ${part} of ${
										operations[shas.indexOf(obj.oid)].path
									} to LFS storage`,
								});
							}

							const eTag = res.headers.get("ETag");

							if (!eTag) {
								throw new Error("Cannot get ETag of part during multipart upload");
							}

							completeReq.parts[Number(part) - 1].etag = eTag;
						}),
						MULTIPART_PARALLEL_UPLOAD
					);

					const res = await (params.fetch ?? fetch)(completionUrl, {
						method: "POST",
						body: JSON.stringify(completeReq),
						headers: {
							Accept: "application/vnd.git-lfs+json",
							"Content-Type": "application/vnd.git-lfs+json",
						},
					});

					if (!res.ok) {
						throw await createApiError(res, {
							requestId: batchRequestId,
							message: `Error completing multipart upload of ${operations[shas.indexOf(obj.oid)].path} to LFS storage`,
						});
					}
				} else {
					const res = await (params.fetch ?? fetch)(obj.actions.upload.href, {
						method: "PUT",
						headers: {
							...(batchRequestId ? { "X-Request-Id": batchRequestId } : undefined),
						},
						/** Unfortunately, browsers don't support our inherited version of Blob in fetch calls */
						body: content instanceof WebBlob && isFrontend ? await content.arrayBuffer() : content,
					});

					if (!res.ok) {
						throw await createApiError(res, {
							requestId: batchRequestId,
							message: `Error while uploading ${operations[shas.indexOf(obj.oid)].path} to LFS storage`,
						});
					}
				}
			}),
			CONCURRENT_LFS_UPLOADS
		);
	}

	yield { event: "phase", phase: "committing" };

	const res = await (params.fetch ?? fetch)(
		`${params.hubUrl ?? HUB_URL}/api/${repoId.type}s/${repoId.name}/commit/${encodeURIComponent(
			params.branch ?? "main"
		)}` + (params.isPullRequest ? "?create_pr=1" : ""),
		{
			method: "POST",
			headers: {
				...(params.credentials && { Authorization: `Bearer ${params.credentials.accessToken}` }),
				"Content-Type": "application/x-ndjson",
			},
			body: [
				{
					key: "header",
					value: {
						summary: params.title,
						description: params.description,
						parentCommit: params.parentCommit,
					} satisfies ApiCommitHeader,
				},
				...((await Promise.all(
					allOperations.map((operation) => {
						if (isFileOperation(operation)) {
							const sha = lfsShas.get(operation.path);
							if (sha) {
								return {
									key: "lfsFile",
									value: {
										path: operation.path,
										algo: "sha256",
										size: operation.content.size,
										oid: sha,
									} satisfies ApiCommitLfsFile,
								};
							}
						}

						return convertOperationToNdJson(operation);
					})
				)) satisfies ApiCommitOperation[]),
			]
				.map((x) => JSON.stringify(x))
				.join("\n"),
		}
	);

	if (!res.ok) {
		throw await createApiError(res);
	}

	const json = await res.json();

	return {
		pullRequestUrl: json.pullRequestUrl,
		commit: {
			oid: json.commitOid,
			url: json.commitUrl,
		},
		hookOutput: json.hookOutput,
	};
}

export async function commit(params: CommitParams): Promise<CommitOutput> {
	const iterator = commitIter(params);
	let res = await iterator.next();
	while (!res.done) {
		res = await iterator.next();
	}
	return res.value;
}

async function convertOperationToNdJson(operation: CommitBlobOperation): Promise<ApiCommitOperation> {
	switch (operation.operation) {
		case "addOrUpdate": {
			// todo: handle LFS
			return {
				key: "file",
				value: {
					content: base64FromBytes(new Uint8Array(await operation.content.arrayBuffer())),
					path: operation.path,
					encoding: "base64",
				},
			};
		}
		// case "rename": {
		// 	// todo: detect when remote file is already LFS, and in that case rename as LFS
		// 	return {
		// 		key:   "file",
		// 		value: {
		// 			content: operation.content,
		// 			path:    operation.path,
		// 			oldPath: operation.oldPath
		// 		}
		// 	};
		// }
		case "delete": {
			return {
				key: "deletedFile",
				value: {
					path: operation.path,
				},
			};
		}
		default:
			throw new TypeError("Unknown operation: " + (operation as { operation: string }).operation);
	}
}
