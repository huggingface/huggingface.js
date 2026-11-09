import { assert, it, describe } from "vitest";
import { TEST_ACCESS_TOKEN, TEST_HUB_URL, TEST_USER } from "../test/consts";
import type { RepoId } from "../types/public";
import { insecureRandomString } from "../utils/insecureRandomString";
import { createRepo } from "./create-repo";
import { deleteRepo } from "./delete-repo";
import { uploadFile } from "./upload-file";
import { downloadFile } from "./download-file";
import { moveRepo } from "./move-repo";
import { repoExists } from "./repo-exists";

describe("moveRepo", () => {
	it("should rename a repo, keeping its content", async () => {
		const suffix = insecureRandomString();
		const fromRepo = { type: "model", name: `${TEST_USER}/TEST-${suffix}` } satisfies RepoId;
		const toRepo = { type: "model", name: `${TEST_USER}/TEST-${suffix}-moved` } satisfies RepoId;

		try {
			await createRepo({
				accessToken: TEST_ACCESS_TOKEN,
				hubUrl: TEST_HUB_URL,
				repo: fromRepo,
			});

			await uploadFile({
				repo: fromRepo,
				accessToken: TEST_ACCESS_TOKEN,
				hubUrl: TEST_HUB_URL,
				file: {
					path: "file.txt",
					content: new Blob(["file content"]),
				},
			});

			await moveRepo({
				fromRepo,
				toRepo,
				accessToken: TEST_ACCESS_TOKEN,
				hubUrl: TEST_HUB_URL,
			});

			assert.isTrue(
				await repoExists({
					repo: toRepo,
					accessToken: TEST_ACCESS_TOKEN,
					hubUrl: TEST_HUB_URL,
				})
			);

			const content = await downloadFile({
				repo: toRepo,
				accessToken: TEST_ACCESS_TOKEN,
				hubUrl: TEST_HUB_URL,
				path: "file.txt",
			});

			assert.equal(await content?.text(), "file content");
		} finally {
			await deleteRepo({
				repo: toRepo,
				accessToken: TEST_ACCESS_TOKEN,
				hubUrl: TEST_HUB_URL,
			});
		}
	});
});
