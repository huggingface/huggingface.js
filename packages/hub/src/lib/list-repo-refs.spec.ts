import { assert, it, describe } from "vitest";
import { TEST_ACCESS_TOKEN, TEST_HUB_URL, TEST_USER } from "../test/consts";
import type { RepoId } from "../types/public";
import { insecureRandomString } from "../utils/insecureRandomString";
import { createRepo } from "./create-repo";
import { deleteRepo } from "./delete-repo";
import { createBranch } from "./create-branch";
import { createTag } from "./create-tag";
import { listRepoRefs } from "./list-repo-refs";

describe("listRepoRefs", () => {
	it("should list the branches and tags of a repo", async () => {
		const repoName = `${TEST_USER}/TEST-${insecureRandomString()}`;
		const repo = { type: "model", name: repoName } satisfies RepoId;

		try {
			await createRepo({
				accessToken: TEST_ACCESS_TOKEN,
				hubUrl: TEST_HUB_URL,
				repo,
			});

			await createBranch({
				repo,
				branch: "test-branch",
				accessToken: TEST_ACCESS_TOKEN,
				hubUrl: TEST_HUB_URL,
			});

			await createTag({
				repo,
				tag: "v1.0.0",
				accessToken: TEST_ACCESS_TOKEN,
				hubUrl: TEST_HUB_URL,
			});

			const refs = await listRepoRefs({
				repo,
				accessToken: TEST_ACCESS_TOKEN,
				hubUrl: TEST_HUB_URL,
			});

			assert.deepEqual(refs.branches.map((branch) => branch.name).sort(), ["main", "test-branch"]);
			assert.deepEqual(
				refs.tags.map((tag) => tag.name),
				["v1.0.0"],
			);
			for (const ref of [...refs.branches, ...refs.tags]) {
				assert.match(ref.ref, /^refs\/(heads|tags)\//);
				assert.match(ref.targetCommit, /^[0-9a-f]{40}$/);
			}
		} finally {
			await deleteRepo({
				repo,
				accessToken: TEST_ACCESS_TOKEN,
				hubUrl: TEST_HUB_URL,
			});
		}
	});
});
