import { assert, it, describe } from "vitest";

import { HUB_URL, TEST_ACCESS_TOKEN, TEST_USER } from "../consts";
import type { RepoId } from "../types/public";
import { insecureRandomString } from "../utils/insecureRandomString";
import { createRepo } from "./create-repo";
import { deleteRepo } from "./delete-repo";
import { deleteFile } from "./delete-file";
import { downloadFile } from "./download-file";

describe("deleteFile", () => {
	it("should delete a file", async () => {
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

			await deleteFile({ path: "file1", repo, credentials });

			content = await downloadFile({
				repo,
				path: "file1",
			});

			assert.strictEqual(content, null);

			content = await downloadFile({
				repo,
				path: "file2",
			});

			assert.strictEqual(await content?.text(), "file2");
		} finally {
			await deleteRepo({
				repo,
				credentials,
			});
		}
	});
});
