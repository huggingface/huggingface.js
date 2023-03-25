import { assert, it, describe, expect } from "vitest";

import { HUB_URL, TEST_ACCESS_TOKEN, TEST_USER } from "../consts";
import type { RepoId } from "../types/public";
import { createBlob } from "./commit";
import { commit } from "./commit";
import { createRepo } from "./create-repo";
import { deleteRepo } from "./delete-repo";
import { downloadFile } from "./download-file";
import { insecureRandomString } from "../utils/insecureRandomString";
import { isBackend, isFrontend } from "../utils/env-predicates";
import { WebBlob } from "../utils/WebBlob";
import { FileBlob } from "../utils/FileBlob";

const lfsContent = "O123456789".repeat(100_000);

describe("commit", () => {
	it("should commit to a repo with blobs", async function () {
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

		const readme1 = await downloadFile({ repo, path: "README.md" });
		assert.strictEqual(readme1?.status, 200);

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
						// This will use a WebBlob in frontend and FileBlob in the backend
						content: await createBlob("./tsconfig.json"),
						path: "tsconfig.json",
					},
					{
						operation: "addOrUpdate",
						content: new Blob([lfsContent]),
						path: "test.lfs.txt",
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

			const fileUrlContent = await downloadFile({ repo, path: "tsconfig.json" });
			assert.strictEqual(fileUrlContent?.status, 200);
			assert.strictEqual(await fileUrlContent?.text(), await (await createBlob("./tsconfig.json")).text());

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

	it("should return the correct type of Blob with 'createBlob'", async () => {
		if (isFrontend) {
			await expect(createBlob("file://cuesta-viento.json")).rejects.toMatchObject(
				"File URLs are not supported in browsers"
			);

			await expect(
				createBlob("https://huggingface.co/spaces/aschen/push-model-from-web/raw/main/mobilenet/model.json")
			).resolves.toBeInstanceOf(WebBlob);
		}

		if (isBackend) {
			await expect(createBlob("file://package.json")).resolves.toBeInstanceOf(FileBlob);

			await expect(createBlob("./package.json")).resolves.toBeInstanceOf(FileBlob);

			await expect(
				createBlob("https://huggingface.co/spaces/aschen/push-model-from-web/raw/main/mobilenet/model.json")
			).resolves.toBeInstanceOf(WebBlob);

			await expect(createBlob("ftp://aschen.ovh/lamaral.json")).rejects.toThrowError("Unsupported URL protocol");
		}
	});
});
