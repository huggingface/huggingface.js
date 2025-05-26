import { assert, it, describe } from "vitest";
import { TEST_ACCESS_TOKEN, TEST_HUB_URL, TEST_USER } from '../test/consts.js';
import type { RepoId } from '../types/public.js';
import { insecureRandomString } from '../utils/insecureRandomString.js';
import { createRepo } from './create-repo.js';
import { deleteRepo } from './delete-repo.js';
import { createBranch } from './create-branch.js';
import { uploadFile } from './upload-file.js';
import { downloadFile } from './download-file.js';

describe("createBranch", () => {
	it("should create a new branch from the default branch", async () => {
		const repoName = `${TEST_USER}/TEST-${insecureRandomString()}`;
		const repo = { type: "model", name: repoName } satisfies RepoId;

		try {
			await createRepo({
				accessToken: TEST_ACCESS_TOKEN,
				hubUrl: TEST_HUB_URL,
				repo,
			});

			await uploadFile({
				repo,
				accessToken: TEST_ACCESS_TOKEN,
				hubUrl: TEST_HUB_URL,
				file: {
					path: "file.txt",
					content: new Blob(["file content"]),
				},
			});

			await createBranch({
				repo,
				branch: "new-branch",
				accessToken: TEST_ACCESS_TOKEN,
				hubUrl: TEST_HUB_URL,
			});

			const content = await downloadFile({
				repo,
				accessToken: TEST_ACCESS_TOKEN,
				hubUrl: TEST_HUB_URL,
				path: "file.txt",
				revision: "new-branch",
			});

			assert.equal(await content?.text(), "file content");
		} finally {
			await deleteRepo({
				repo,
				accessToken: TEST_ACCESS_TOKEN,
				hubUrl: TEST_HUB_URL,
			});
		}
	});

	it("should create an empty branch", async () => {
		const repoName = `${TEST_USER}/TEST-${insecureRandomString()}`;
		const repo = { type: "model", name: repoName } satisfies RepoId;

		try {
			await createRepo({
				accessToken: TEST_ACCESS_TOKEN,
				hubUrl: TEST_HUB_URL,
				repo,
			});

			await uploadFile({
				repo,
				accessToken: TEST_ACCESS_TOKEN,
				hubUrl: TEST_HUB_URL,
				file: {
					path: "file.txt",
					content: new Blob(["file content"]),
				},
			});

			await createBranch({
				repo,
				branch: "empty-branch",
				empty: true,
				accessToken: TEST_ACCESS_TOKEN,
				hubUrl: TEST_HUB_URL,
			});

			const content = await downloadFile({
				repo,
				accessToken: TEST_ACCESS_TOKEN,
				hubUrl: TEST_HUB_URL,
				path: "file.txt",
				revision: "empty-branch",
			});

			assert.equal(content, null);
		} finally {
			await deleteRepo({
				repo,
				accessToken: TEST_ACCESS_TOKEN,
				hubUrl: TEST_HUB_URL,
			});
		}
	});

	it("should overwrite an existing branch", async () => {
		const repoName = `${TEST_USER}/TEST-${insecureRandomString()}`;
		const repo = { type: "model", name: repoName } satisfies RepoId;

		try {
			await createRepo({
				accessToken: TEST_ACCESS_TOKEN,
				hubUrl: TEST_HUB_URL,
				repo,
			});

			await uploadFile({
				repo,
				accessToken: TEST_ACCESS_TOKEN,
				hubUrl: TEST_HUB_URL,
				file: {
					path: "file.txt",
					content: new Blob(["file content"]),
				},
			});

			await createBranch({
				repo,
				branch: "overwrite-branch",
				accessToken: TEST_ACCESS_TOKEN,
				hubUrl: TEST_HUB_URL,
			});

			await createBranch({
				repo,
				branch: "overwrite-branch",
				overwrite: true,
				empty: true,
				accessToken: TEST_ACCESS_TOKEN,
				hubUrl: TEST_HUB_URL,
			});

			const content = await downloadFile({
				repo,
				accessToken: TEST_ACCESS_TOKEN,
				hubUrl: TEST_HUB_URL,
				path: "file.txt",
				revision: "overwrite-branch",
			});

			assert.equal(content, null);
		} finally {
			await deleteRepo({
				repo,
				accessToken: TEST_ACCESS_TOKEN,
				hubUrl: TEST_HUB_URL,
			});
		}
	});
});
