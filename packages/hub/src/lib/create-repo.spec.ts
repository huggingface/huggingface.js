import { assert, it, describe, expect } from "vitest";

import { randomBytes } from "crypto";
import { HUB_URL, TEST_ACCESS_TOKEN, TEST_USER } from "../consts";
import { createRepo } from "./create-repo";
import { deleteRepo } from "./delete-repo";
import { downloadFile } from "./download-file";

describe("createRepo", () => {
	it("should create a repo", async () => {
		const repoName = `${TEST_USER}/TEST-${randomBytes(10).toString("hex")}`;

		const result = await createRepo({
			credentials: {
				accessToken: TEST_ACCESS_TOKEN,
			},
			repo: {
				name: repoName,
				type: "model",
			},
			files: [{ path: ".gitattributes", content: new Blob(["*.html filter=lfs diff=lfs merge=lfs -text"]) }],
		});

		assert.deepStrictEqual(result, {
			repoUrl: `${HUB_URL}/${repoName}`,
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

	it("should throw a client error when trying to create a repo without a fully-qualified name", async () => {
		const tryCreate = createRepo({
			repo:        { name: "canonical", type: "model" },
			credentials: { accessToken: TEST_ACCESS_TOKEN },
		});

		await expect(tryCreate).rejects.toBeInstanceOf(TypeError);
	});
});
