import { createApiError } from "./error";
import type { Credentials, RepoId } from "./types/repo";

const HUB_URL = "https://huggingface.co";
const HUB_API_URL = "https://huggingface.co/api";

export interface ApiCommitHeader {
	summary:       string;
	description?:  string;
	/**
	 * Parent commit. Optional
	 *
	 * - When opening a PR: will use parentCommit as the parent commit
	 * - When committing on a branch: Will make sure that there were no intermediate commits
	 */
	parentCommit?: string;
}

interface ApiCommitDeletedEntry {
	path: string;
}

interface ApiCommitLfsFile {
	path:     string;
	oldPath?: string;
	/** Required if {@link oldPath} is not set */
	algo?:    "sha256";
	/** Required if {@link oldPath} is not set */
	oid?:     string;
	size?:    number;
}

interface ApiCommitFile {
	/** Required if {@link oldPath} is not set */
	content?:  string;
	path:      string;
	oldPath?:  string;
	encoding?: "utf-8" | "base64";
}

export type CommitDeletedEntry = {
	operation: "delete";
	path:      string;
};

type ContentSource = string; // Todo: support buffer & web streams

export type CommitFile = {
	operation: "addOrUpdate";
	path:      string;
	content:   ContentSource;
	forceLfs?: boolean; // todo
};

export type CommitRenameFile = {
	operation: "rename";
	path:      string;
	oldPath:   string;
	content?:  ContentSource;
};

export type CommitOperation = CommitDeletedEntry | CommitFile | CommitRenameFile;

export interface CommitParams {
	title:          string;
	description?:   string;
	repo:           RepoId;
	operations:     CommitOperation[];
	credentials:    Credentials;
	/** Default: "main" */
	branch?:        string;
	/**
	 * Parent commit. Optional
	 *
	 * - When opening a PR: will use parentCommit as the parent commit
	 * - When committing on a branch: Will make sure that there were no intermediate commits
	 */
	parentCommit?:  string;
	isPullRequest?: boolean;
}

export interface CommitOutput {
	pullRequestUrl?: string;
	commit:          {
		oid: string;
		url: string;
	};
	hookOutput: string;
}

export async function commit(params: CommitParams): Promise<CommitOutput> {
	const res = await fetch(
		`${HUB_API_URL}/${params.repo.type}s/${params.repo.name}/commit/${encodeURIComponent(params.branch ?? "main")}` +
			(params.isPullRequest ? "?create_pr=1" : ""),
		{
			headers: {
				Authorization:  `Bearer ${params.credentials.accessToken}`,
				"Content-Type": "application/x-ndjson"
			},
			body: [
				{
					key:   "header",
					value: {
						summary:      params.title,
						description:  params.description,
						parentCommit: params.parentCommit
					} satisfies ApiCommitHeader
				},
				...params.operations.map((operation) => convertOperationToNdJson(operation))
			]
				.map((x) => JSON.stringify(x))
				.join("\n")
		}
	);

	if (!res.ok) {
		throw createApiError(res);
	}

	const json = await res.json();

	return {
		pullRequestUrl: json.pullRequestUrl,
		commit:         {
			oid: json.commitOid,
			url: json.commitUrl
		},
		hookOutput: json.hookOutput
	};
}

function convertOperationToNdJson(operation: CommitOperation) {
	switch (operation.operation) {
		case "addOrUpdate": {
			// todo: handle LFS
			return {
				key:   "file",
				value: {
					content: operation.content,
					path:    operation.path
				}
			};
		}
		case "rename": {
			// todo: detect when remote file is already LFS, and in that case rename as LFS
			return {
				key:   "file",
				value: {
					content: operation.content,
					path:    operation.path,
					oldPath: operation.oldPath
				}
			};
		}
		case "delete": {
			return {
				key:   "deletedFile",
				value: {
					path: operation.path
				}
			};
		}
		default:
			throw new TypeError("Unknown operation: " + (operation as any).operation);
	}
}
