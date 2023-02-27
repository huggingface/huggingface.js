import { HUB_URL } from "../consts";
import { ApiError, createApiError } from "../error";
import type {
	ApiCommitLfsFile,
	ApiPreuploadRequest,
	ApiPreuploadResponse,
	ApiCommitHeader,
	ApiLfsBatchRequest,
	ApiLfsBatchResponse,
	ApiLfsCompleteMultipartRequest,
	ApiCommitOperation,
} from "../types/api";
import type { Credentials, RepoId } from "../types/repo";
import { base64FromBytes, chunk, promisesQueue, promisesQueueStreaming, sha256 } from "../utils";

const CONCURRENT_SHAS = 5;
const CONCURRENT_LFS_UPLOADS = 5;
const MULTIPART_PARALLEL_UPLOAD = 5;

export type CommitDeletedEntry = {
	operation: "delete";
	path:      string;
};

type ContentSource = Blob; // Todo: offer a smart Blob wrapper around (filePath + size) for Node.js

export type CommitFile = {
	operation: "addOrUpdate";
	path:      string;
	content:   ContentSource;
	// forceLfs?: boolean
};

// TODO: find a nice way to handle LFS & non-LFS files in an uniform manner, see https://github.com/huggingface/moon-landing/issues/4370y
// export type CommitRenameFile = {
// 	operation: "rename";
// 	path:      string;
// 	oldPath:   string;
// 	content?:  ContentSource;
// };

export type CommitOperation = CommitDeletedEntry | CommitFile /* | CommitRenameFile */;

export interface CommitParams {
	title:          string;
	description?:   string;
	repo:           RepoId;
	operations:     CommitOperation[];
	credentials:    Credentials;
	/** @default "main" */
	branch?:        string;
	/**
	 * Parent commit. Optional
	 *
	 * - When opening a PR: will use parentCommit as the parent commit
	 * - When committing on a branch: Will make sure that there were no intermediate commits
	 */
	parentCommit?:  string;
	isPullRequest?: boolean;
	hubUrl?:        string;
}

export interface CommitOutput {
	pullRequestUrl?: string;
	commit:          {
		oid: string;
		url: string;
	};
	hookOutput: string;
}

function isFileOperation(op: CommitOperation): op is CommitFile {
	return op.operation === "addOrUpdate";
}

/**
 * Internal function for now, used by commit.
 *
 * Can be exposed later to offer fine-tuned progress info
 */
async function* commitIter(params: CommitParams): AsyncGenerator<unknown, CommitOutput> {
	yield "preuploading";

	const lfsShas = new Map<string, string | null>();

	const gitAttributes = (
		params.operations.find((op) => isFileOperation(op) && op.path === ".gitattributes") as CommitFile | undefined
	)?.content;

	for (const operations of chunk(params.operations.filter(isFileOperation), 100)) {
		const payload: ApiPreuploadRequest = {
			gitAttributes: gitAttributes && (await gitAttributes.text()),
			files:         await Promise.all(
				operations.map(async (operation) => ({
					path:   operation.path,
					size:   operation.content.size,
					sample: base64FromBytes(new Uint8Array(await operation.content.slice(0, 512).arrayBuffer())),
				}))
			),
		};

		const res = await fetch(
			`${params.hubUrl ?? HUB_URL}/api/${params.repo.type}s/${params.repo.name}/preupload/${encodeURIComponent(
				params.branch ?? "main"
			)}` + (params.isPullRequest ? "?create_pr=1" : ""),
			{
				method:  "POST",
				headers: {
					Authorization:  `Bearer ${params.credentials.accessToken}`,
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

	yield "uploading to LFS";

	for (const operations of chunk(
		params.operations.filter(isFileOperation).filter((op) => lfsShas.has(op.path)),
		100
	)) {
		yield `hashing ${operations.length} files`;

		const shas = await promisesQueue(
			operations.map((op) => async () => {
				const sha = await sha256(op.content);
				lfsShas.set(op.path, sha);
				return sha;
			}),
			CONCURRENT_SHAS
		);

		const payload: ApiLfsBatchRequest = {
			operation: "upload",
			// multipart is a custom protocol for HF
			transfers: ["basic", "multipart"],
			hash_algo: "sha_256",
			ref:       {
				name: params.branch ?? "main",
			},
			objects: operations.map((op, i) => ({
				oid:  shas[i],
				size: op.content.size,
			})),
		};

		const res = await fetch(
			`${params.hubUrl ?? HUB_URL}/${params.repo.type === "model" ? "" : params.repo.type + "s/"}${
				params.repo.name
			}.git/info/lfs/objects/batch`,
			{
				method:  "POST",
				headers: {
					Authorization:  `Bearer ${params.credentials.accessToken}`,
					Accept:         "application/vnd.git-lfs+json",
					"Content-Type": "application/vnd.git-lfs+json",
				},
				body: JSON.stringify(payload),
			}
		);

		if (!res.ok) {
			throw await createApiError(res);
		}

		const json: ApiLfsBatchResponse = await res.json();
		const batchRequestId = res.headers.get("X-Request-Id")!;

		const shaToOperation = new Map(operations.map((op, i) => [shas[i], op]));

		await promisesQueueStreaming(
			json.objects.map((obj) => async () => {
				const op = shaToOperation.get(obj.oid)!;

				if (obj.error) {
					const errorMessage = `Error while doing LFS batch call for ${operations[shas.indexOf(obj.oid)].path}: ${
						obj.error.message
					} - Request ID: ${batchRequestId}`;
					throw new ApiError(res.url, obj.error.code, batchRequestId, errorMessage);
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

					if (parts.length !== Math.ceil(content.length / chunkSize)) {
						throw new Error("Invalid server response to upload large LFS file, wrong number of parts");
					}

					const completeReq: ApiLfsCompleteMultipartRequest = {
						oid:   obj.oid,
						parts: parts.map((part) => ({
							partNumber: +part,
							etag:       "",
						})),
					};

					await promisesQueue(
						parts.map((part) => async () => {
							const index = parseInt(part) - 1;
							const res = await fetch(header[part], {
								method: "PUT",
								body:   content.slice(index * chunkSize, (index + 1) * chunkSize),
							});

							if (!res.ok) {
								throw await createApiError(res, {
									requestId: batchRequestId,
									message:   `Error while uploading part ${part} of ${
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

					const res = await fetch(completionUrl, {
						method:  "POST",
						body:    JSON.stringify(completeReq),
						headers: {
							Accept:         "application/vnd.git-lfs+json",
							"Content-Type": "application/vnd.git-lfs+json",
						},
					});

					if (!res.ok) {
						throw await createApiError(res, {
							requestId: batchRequestId,
							message:   `Error completing multipart upload of ${operations[shas.indexOf(obj.oid)].path} to LFS storage`,
						});
					}
				} else {
					const res = await fetch(obj.actions.upload.href, {
						method:  "PUT",
						headers: {
							"X-Request-Id": batchRequestId,
						},
						body: content,
					});

					if (!res.ok) {
						throw await createApiError(res, {
							requestId: batchRequestId,
							message:   `Error while uploading ${operations[shas.indexOf(obj.oid)].path} to LFS storage`,
						});
					}
				}
			}),
			CONCURRENT_LFS_UPLOADS
		);
	}

	yield "committing";

	const res = await fetch(
		`${params.hubUrl ?? HUB_URL}/api/${params.repo.type}s/${params.repo.name}/commit/${encodeURIComponent(
			params.branch ?? "main"
		)}` + (params.isPullRequest ? "?create_pr=1" : ""),
		{
			method:  "POST",
			headers: {
				Authorization:  `Bearer ${params.credentials.accessToken}`,
				"Content-Type": "application/x-ndjson",
			},
			body: [
				{
					key:   "header",
					value: {
						summary:      params.title,
						description:  params.description,
						parentCommit: params.parentCommit,
					} satisfies ApiCommitHeader,
				},
				...((await Promise.all(
					params.operations.map((operation) =>
						isFileOperation(operation) && lfsShas.has(operation.path)
							? {
									key:   "lfsFile",
									value: {
										path: operation.path,
										algo: "sha256",
										size: operation.content.length,
										oid:  lfsShas.get(operation.path)!,
									} satisfies ApiCommitLfsFile,
							  }
							: convertOperationToNdJson(operation)
					)
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
		commit:         {
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

async function convertOperationToNdJson(operation: CommitOperation): Promise<ApiCommitOperation> {
	switch (operation.operation) {
		case "addOrUpdate": {
			// todo: handle LFS
			return {
				key:   "file",
				value: {
					content:  base64FromBytes(new Uint8Array(await operation.content.arrayBuffer())),
					path:     operation.path,
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
				key:   "deletedFile",
				value: {
					path: operation.path,
				},
			};
		}
		default:
			throw new TypeError("Unknown operation: " + (operation as any).operation);
	}
}
