import { it, describe } from "vitest";
import { TEST_ACCESS_TOKEN, TEST_HUB_URL, TEST_USER } from "../test/consts.js";
import type { RepoId } from "../types/public.js";
import { insecureRandomString } from "../utils/insecureRandomString.js";
import { createRepo } from "./create-repo.js";
import { deleteRepo } from "./delete-repo.js";
import { createBranch } from "./create-branch.js";
import { deleteBranch } from "./delete-branch.js";

describe("deleteBranch", () => {
	it("should delete an existing branch", async () => {
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
				branch: "branch-to-delete",
				accessToken: TEST_ACCESS_TOKEN,
				hubUrl: TEST_HUB_URL,
			});

			await deleteBranch({
				repo,
				branch: "branch-to-delete",
				accessToken: TEST_ACCESS_TOKEN,
				hubUrl: TEST_HUB_URL,
			});
		} finally {
			await deleteRepo({
				repo,
				accessToken: TEST_ACCESS_TOKEN,
				hubUrl: TEST_HUB_URL,
			});
		}
	});
});
