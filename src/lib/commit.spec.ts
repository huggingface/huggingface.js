import * as assert from "assert";
import { randomBytes } from "crypto";
import { HUB_URL, TEST_ACCESS_TOKEN, TEST_USER } from "../consts";
import { commit } from "./commit";
import { createRepo } from "./create-repo";
import { deleteRepo } from "./delete-repo";

describe("commit", () => {
	it("should commit to a repo", async () => {
		const repoName = `${TEST_USER}/TEST-${randomBytes(10).toString("hex")}`;

		await createRepo({
			credentials: {
				accessToken: TEST_ACCESS_TOKEN
			},
			repo: {
				name: repoName,
				type: "model"
			},
			license: "mit"
		});

		try {
			await commit({
				repo: {
					name: repoName,
					type: "model"
				},
				title:       "Some commit",
				credentials: {
					accessToken: TEST_ACCESS_TOKEN
				},
				operations: [
					{
						operation: "addOrUpdate",
						content:   Buffer.from("This is me"),
						path:      "test.txt"
					},
					{
						operation: "addOrUpdate",
						content:   Buffer.from("This is a LFS file"),
						path:      "test.lfs.text"
					},
					{
						operation: "delete",
						path:      "README.md"
					}
				]
			});

			const fileContent = await fetch(`${HUB_URL}/${repoName}/resolve/main/test.txt`);
			assert.strictEqual(fileContent.status, 200);
			assert.strictEqual(await fileContent.text(), "This is me");

			const lfsFileContent = await fetch(`${HUB_URL}/${repoName}/resolve/main/test.txt`);
			assert.strictEqual(lfsFileContent.status, 200);
			assert.strictEqual(await lfsFileContent.text(), "This is a LFS file");

			const lfsFilePointer = await fetch(`${HUB_URL}/${repoName}/raw/main/test.txt`);
			assert.strictEqual(lfsFilePointer.status, 200);
			assert.strictEqual(
				await lfsFilePointer.text(),
				`
version https://git-lfs.github.com/spec/v1
oid sha256:ea201fabe466ef7182f1f687fb5be4b62a73d3a78883f11264ff7f682cdb54bf
size 438064459
        `.trim()
			);

			const readme = await fetch(`${HUB_URL}/${repoName}/resolve/main/test.txt`);

			assert.strictEqual(readme.status, 404);
		} finally {
			await deleteRepo({
				repo: {
					name: repoName,
					type: "model"
				},
				credentials: { accessToken: TEST_ACCESS_TOKEN }
			});
		}
	});
});
