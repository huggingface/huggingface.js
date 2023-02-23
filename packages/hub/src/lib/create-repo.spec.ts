import { randomBytes } from "crypto";
import { TEST_ACCESS_TOKEN, TEST_USER } from "../consts";
import { createRepo } from "./create-repo";
import { deleteRepo } from "./delete-repo";
import { downloadFile } from "./download-file";
import * as assert from "assert";

describe("createRepo", () => {
	it("should create a repo", async () => {
		const repoName = `${TEST_USER}/TEST-${randomBytes(10).toString("hex")}`;

		await createRepo({
			credentials: {
				accessToken: TEST_ACCESS_TOKEN,
			},
			repo: {
				name: repoName,
				type: "model",
			},
			files: [{ path: ".gitattributes", content: new Blob(["*.html filter=lfs diff=lfs merge=lfs -text"]) }],
		});

		const content = await downloadFile({
			repo: {
				name: repoName,
				type: "model",
			},
			path: ".gitattributes",
		});

		assert(content);
		assert.strictEqual(await content.text(), "*.html filter=lfs diff=lfs merge=lfs -text");

		await deleteRepo({
			repo: {
				name: repoName,
				type: "model",
			},
			credentials: { accessToken: TEST_ACCESS_TOKEN },
		});
	});
});
