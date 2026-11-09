import { assert, it, describe } from "vitest";
import { TEST_ACCESS_TOKEN, TEST_HUB_URL, TEST_USER } from "../test/consts";
import type { RepoId } from "../types/public";
import { insecureRandomString } from "../utils/insecureRandomString";
import { createRepo } from "./create-repo";
import { deleteRepo } from "./delete-repo";
import { createTag } from "./create-tag";
import { listRepoRefs } from "./list-repo-refs";

describe("createTag", () => {
	it("should create a tag on the default revision", async () => {
		const repoName = `${TEST_USER}/TEST-${insecureRandomString()}`;
		const repo = { type: "model", name: repoName } satisfies RepoId;

		try {
			await createRepo({
				accessToken: TEST_ACCESS_TOKEN,
				hubUrl: TEST_HUB_URL,
				repo,
			});

			await createTag({
				repo,
				tag: "v0.0.1",
				accessToken: TEST_ACCESS_TOKEN,
				hubUrl: TEST_HUB_URL,
			});

			const refs = await listRepoRefs({
				repo,
				accessToken: TEST_ACCESS_TOKEN,
				hubUrl: TEST_HUB_URL,
			});

			assert.deepEqual(
				refs.tags.map((tag) => tag.name),
				["v0.0.1"],
			);
			assert.equal(refs.tags[0]?.ref, "refs/tags/v0.0.1");
		} finally {
			await deleteRepo({
				repo,
				accessToken: TEST_ACCESS_TOKEN,
				hubUrl: TEST_HUB_URL,
			});
		}
	});

	it("should create a tag with a message on a given revision", async () => {
		const repoName = `${TEST_USER}/TEST-${insecureRandomString()}`;
		const repo = { type: "model", name: repoName } satisfies RepoId;

		try {
			await createRepo({
				accessToken: TEST_ACCESS_TOKEN,
				hubUrl: TEST_HUB_URL,
				repo,
			});

			const refsBefore = await listRepoRefs({
				repo,
				accessToken: TEST_ACCESS_TOKEN,
				hubUrl: TEST_HUB_URL,
			});
			const mainCommit = refsBefore.branches.find((branch) => branch.name === "main")?.targetCommit;

			await createTag({
				repo,
				tag: "v0.1.0",
				tagMessage: "First release",
				revision: mainCommit,
				accessToken: TEST_ACCESS_TOKEN,
				hubUrl: TEST_HUB_URL,
			});

			const refs = await listRepoRefs({
				repo,
				accessToken: TEST_ACCESS_TOKEN,
				hubUrl: TEST_HUB_URL,
			});

			assert.equal(refs.tags[0]?.name, "v0.1.0");
			assert.equal(refs.tags[0]?.ref, "refs/tags/v0.1.0");
			// Annotated tags point to a tag object, not directly to the tagged commit
			assert.match(refs.tags[0]?.targetCommit ?? "", /^[0-9a-f]{40}$/);
		} finally {
			await deleteRepo({
				repo,
				accessToken: TEST_ACCESS_TOKEN,
				hubUrl: TEST_HUB_URL,
			});
		}
	});
});
