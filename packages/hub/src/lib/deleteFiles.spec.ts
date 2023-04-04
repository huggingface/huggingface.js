import { assert, it, describe } from "vitest";

import { HUB_URL, TEST_ACCESS_TOKEN, TEST_USER } from "../consts";
import type { RepoId } from "../types/public";
import { insecureRandomString } from "../utils/insecureRandomString";
import { createRepo } from "./create-repo";
import { deleteRepo } from "./delete-repo";
import { deleteFiles } from "./deleteFiles";
import { downloadFile } from "./download-file";

describe("deleteFiles", () => {
	it("should delete multiple files", async () => {
		const repoName = `${TEST_USER}/TEST-${insecureRandomString()}`;
		const repo = { type: "model", name: repoName } satisfies RepoId;
		const credentials = {
			accessToken: TEST_ACCESS_TOKEN,
		};

		try {
			const result = await createRepo({
				credentials,
				repo,
				files: [
					{ path: "file1", content: new Blob(["file1"]) },
					{ path: "file2", content: new Blob(["file2"]) },
					{ path: "file3", content: new Blob(["file3"]) },
				],
			});

			assert.deepStrictEqual(result, {
				repoUrl: `${HUB_URL}/${repoName}`,
			});

			let content = await downloadFile({
				repo,
				path: "file1",
			});

			assert.strictEqual(await content?.text(), "file1");

			content = await downloadFile({
				repo,
				path: "file2",
			});

			assert.strictEqual(await content?.text(), "file2");

			await deleteFiles({ paths: ["file1", "file2"], repo, credentials });

			content = await downloadFile({
				repo,
				path: "file1",
			});

			assert.strictEqual(content, null);

			content = await downloadFile({
				repo,
				path: "file2",
			});

			assert.strictEqual(content, null);

			content = await downloadFile({
				repo,
				path: "file3",
			});

			assert.strictEqual(await content?.text(), "file3");
		} finally {
			await deleteRepo({
				repo,
				credentials,
			});
		}
	});
});
