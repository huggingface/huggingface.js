import { assert, it, describe } from "vitest";

import { randomBytes } from "crypto";
import { HUB_URL, TEST_ACCESS_TOKEN, TEST_USER } from "../consts";
import type { RepoId } from "../types/public";
import { commit } from "./commit";
import { createRepo } from "./create-repo";
import { deleteRepo } from "./delete-repo";
import { downloadFile } from "./download-file";
import { LazyBlob } from "./LazyBlob";

const lfsContent = "O123456789".repeat(100_000);

describe("commit", () => {
	it("should commit to a repo with blobs", async function () {
		const repoName = `${TEST_USER}/TEST-${randomBytes(10).toString("hex")}`;
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

		const readme1 = await downloadFile({ repo, path: "README.md" });
		assert.strictEqual(readme1?.status, 200);

		const lazyBlob = await LazyBlob.create("./package.json");

		try {
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
					{
						operation: "addOrUpdate",
						content: lazyBlob,
						path: "package.json",
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

			const packageJsonContent = await downloadFile({ repo, path: "package.json" });
			assert.strictEqual(packageJsonContent?.status, 200);
			assert.strictEqual(await packageJsonContent?.text(), await lazyBlob.text());

			const lfsFilePointer = await fetch(`${HUB_URL}/${repoName}/raw/main/test.lfs.txt`);
			assert.strictEqual(lfsFilePointer.status, 200);
			assert.strictEqual(
				(await lfsFilePointer.text()).trim(),
				`
version https://git-lfs.github.com/spec/v1
oid sha256:a3bbce7ee1df7233d85b5f4d60faa3755f93f537804f8b540c72b0739239ddf8
size ${lfsContent.length}
        `.trim()
			);

			const readme2 = await downloadFile({ repo, path: "README.md" });
			assert.strictEqual(readme2, null);
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
});
