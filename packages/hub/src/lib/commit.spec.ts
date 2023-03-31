import { assert, it, describe } from "vitest";

import { HUB_URL, TEST_ACCESS_TOKEN, TEST_USER } from "../consts";
import type { RepoId } from "../types/public";
import type { CommitFile } from "./commit";
import { commit } from "./commit";
import { createRepo } from "./create-repo";
import { deleteRepo } from "./delete-repo";
import { downloadFile } from "./download-file";
import { fileDownloadInfo } from "./file-download-info";
import { insecureRandomString } from "../utils/insecureRandomString";
import { isFrontend } from "../../../shared/src/env-predicates";
// import { WebBlob } from "../../../shared";

const lfsContent = "O123456789".repeat(100_000);

describe("commit", () => {
	it("should commit to a repo with blobs", async function () {
		const tokenizerJsonUrl = new URL(
			"https://huggingface.co/spaces/aschen/push-model-from-web/raw/main/mobilenet/model.json"
		);
		const repoName = `${TEST_USER}/TEST-${insecureRandomString()}`;
		const repo: RepoId = {
			name: repoName,
			type: "model",
		};

		await createRepo({
			credentials: {
				accessToken: TEST_ACCESS_TOKEN,
			},
			repo,
			license: "mit",
		});

		try {
			const readme1 = await downloadFile({ repo, path: "README.md" });
			assert.strictEqual(readme1?.status, 200);

			const nodeOperation: CommitFile[] = isFrontend
				? []
				: [
						{
							operation: "addOrUpdate",
							path: "tsconfig.json",
							content: (await import("node:url")).pathToFileURL("./tsconfig.json"),
						},
				  ];

			await commit({
				repo,
				title: "Some commit",
				credentials: {
					accessToken: TEST_ACCESS_TOKEN,
				},
				operations: [
					{
						operation: "addOrUpdate",
						content: new Blob(["This is me"]),
						path: "test.txt",
					},
					{
						operation: "addOrUpdate",
						content: new Blob([lfsContent]),
						path: "test.lfs.txt",
					},
					...nodeOperation,
					{
						operation: "addOrUpdate",
						content: tokenizerJsonUrl,
						path: "lamaral.json",
					},
					{
						operation: "delete",
						path: "README.md",
					},
				],
			});

			const fileContent = await downloadFile({ repo, path: "test.txt" });
			assert.strictEqual(fileContent?.status, 200);
			assert.strictEqual(await fileContent?.text(), "This is me");

			const lfsFileContent = await downloadFile({ repo, path: "test.lfs.txt" });
			assert.strictEqual(lfsFileContent?.status, 200);
			assert.strictEqual(await lfsFileContent?.text(), lfsContent);

			const lfsFileUrl = `${HUB_URL}/${repoName}/raw/main/test.lfs.txt`;
			const lfsFilePointer = await fetch(lfsFileUrl);
			assert.strictEqual(lfsFilePointer.status, 200);
			assert.strictEqual(
				(await lfsFilePointer.text()).trim(),
				`
version https://git-lfs.github.com/spec/v1
oid sha256:a3bbce7ee1df7233d85b5f4d60faa3755f93f537804f8b540c72b0739239ddf8
size ${lfsContent.length}
				`.trim()
			);

			if (!isFrontend) {
				const fileUrlContent = await downloadFile({ repo, path: "tsconfig.json" });
				assert.strictEqual(fileUrlContent?.status, 200);
				assert.strictEqual(
					await fileUrlContent?.text(),
					(await import("node:fs")).readFileSync("./tsconfig.json", "utf-8")
				);
			}

			const webResourceContent = await downloadFile({ repo, path: "lamaral.json" });
			assert.strictEqual(webResourceContent?.status, 200);
			assert.strictEqual(await webResourceContent?.text(), await (await fetch(tokenizerJsonUrl)).text());

			const readme2 = await downloadFile({ repo, path: "README.md" });
			assert.strictEqual(readme2, null);

			// Ensure that we are able to create a WebBlob from the LFS file url
			// and follow the redirect to the storage provider
			// const lfsWebBlob = await WebBlob.create(new URL(lfsFileUrl));
			// const lfsFilePointer2 = await fetch(lfsFileUrl);
			// assert.strictEqual(
			// 	await (await lfsFilePointer2.blob()).slice(0, 42).text(),
			// 	await lfsWebBlob.slice(0, 42).text()
			// );
		} finally {
			await deleteRepo({
				repo: {
					name: repoName,
					type: "model",
				},
				credentials: { accessToken: TEST_ACCESS_TOKEN },
			});
		}
	}, 30_000);

	it("should commit a full repo from HF with web urls", async function () {
		const repoName = `${TEST_USER}/TEST-${insecureRandomString()}`;
		const repo: RepoId = {
			name: repoName,
			type: "model",
		};

		await createRepo({
			credentials: {
				accessToken: TEST_ACCESS_TOKEN,
			},
			repo,
		});

		try {
			const FILES_TO_UPLOAD = [
				`https://huggingface.co/spaces/huggingfacejs/push-model-from-web/resolve/main/mobilenet/model.json`,
				`https://huggingface.co/spaces/huggingfacejs/push-model-from-web/resolve/main/mobilenet/group1-shard1of2`,
				`https://huggingface.co/spaces/huggingfacejs/push-model-from-web/resolve/main/mobilenet/group1-shard2of2`,
				`https://huggingface.co/spaces/huggingfacejs/push-model-from-web/resolve/main/mobilenet/coffee.jpg`,
				`https://huggingface.co/spaces/huggingfacejs/push-model-from-web/resolve/main/mobilenet/README.md`,
			];

			const operations: CommitFile[] = await Promise.all(
				FILES_TO_UPLOAD.map(async (file) => {
					return {
						operation: "addOrUpdate",
						path: file.slice(file.indexOf("main/") + "main/".length),
						// upload remote file
						content: new URL(file),
					};
				})
			);
			await commit({
				repo,
				credentials: {
					accessToken: TEST_ACCESS_TOKEN,
				},
				title: "upload model",
				operations,
			});

			const LFSSize = (await fileDownloadInfo({ repo, path: "mobilenet/group1-shard1of2" }))?.size;

			assert.strictEqual(LFSSize, 4_194_304);
		} finally {
			if (!Math.random()) {
				await deleteRepo({
					repo: {
						name: repoName,
						type: "model",
					},
					credentials: { accessToken: TEST_ACCESS_TOKEN },
				});
			}
		}
		// https://huggingfacejs-push-model-from-web.hf.space/
	}, 60_000);
});
