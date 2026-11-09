import { assert, it, describe } from "vitest";
import { TEST_ACCESS_TOKEN, TEST_HUB_URL, TEST_USER } from "../test/consts";
import type { RepoId } from "../types/public";
import { insecureRandomString } from "../utils/insecureRandomString";
import { createRepo } from "./create-repo";
import { deleteRepo } from "./delete-repo";
import { uploadFile } from "./upload-file";
import { listCommits } from "./list-commits";
import { superSquashHistory } from "./super-squash-history";

describe("superSquashHistory", () => {
	it("should squash the history of the main branch into a single commit", async () => {
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
					path: "file-1.txt",
					content: new Blob(["first"]),
				},
			});

			await uploadFile({
				repo,
				accessToken: TEST_ACCESS_TOKEN,
				hubUrl: TEST_HUB_URL,
				file: {
					path: "file-2.txt",
					content: new Blob(["second"]),
				},
			});

			let commitsBefore = 0;
			for await (const commit of listCommits({
				repo,
				accessToken: TEST_ACCESS_TOKEN,
				hubUrl: TEST_HUB_URL,
			})) {
				void commit;
				commitsBefore++;
			}
			assert.isAtLeast(commitsBefore, 2);

			await superSquashHistory({
				repo,
				accessToken: TEST_ACCESS_TOKEN,
				hubUrl: TEST_HUB_URL,
			});

			const titles: string[] = [];
			for await (const commit of listCommits({
				repo,
				accessToken: TEST_ACCESS_TOKEN,
				hubUrl: TEST_HUB_URL,
			})) {
				titles.push(commit.title);
			}
			assert.deepEqual(titles, ["Super-squash branch 'main' using @huggingface/hub"]);
		} finally {
			await deleteRepo({
				repo,
				accessToken: TEST_ACCESS_TOKEN,
				hubUrl: TEST_HUB_URL,
			});
		}
	});
});
