import { assert, it, describe } from "vitest";
import { TEST_ACCESS_TOKEN, TEST_HUB_URL, TEST_USER } from "../test/consts";
import type { RepoId } from "../types/public";
import { insecureRandomString } from "../utils/insecureRandomString";
import { createRepo } from "./create-repo";
import { deleteRepo } from "./delete-repo";
import { addSpaceSecret, deleteSpaceSecret, listSpaceSecrets } from "./space-secrets";
import { addSpaceVariable, deleteSpaceVariable, listSpaceVariables } from "./space-variables";

describe("space secrets and variables", () => {
	it("should add, list and delete a secret on a space", async () => {
		const repoName = `${TEST_USER}/TEST-${insecureRandomString()}`;
		const repo = { type: "space", name: repoName } satisfies RepoId;

		try {
			await createRepo({
				accessToken: TEST_ACCESS_TOKEN,
				hubUrl: TEST_HUB_URL,
				repo,
				sdk: "static",
			});

			await addSpaceSecret({
				repo,
				key: "MY_SECRET",
				value: "super-secret-value",
				description: "test secret",
				accessToken: TEST_ACCESS_TOKEN,
				hubUrl: TEST_HUB_URL,
			});

			const secrets = await listSpaceSecrets({
				repo,
				accessToken: TEST_ACCESS_TOKEN,
				hubUrl: TEST_HUB_URL,
			});
			assert.ok("MY_SECRET" in secrets);
			// secret values are write-only and must never be readable
			assert.ok(!("value" in secrets.MY_SECRET));

			await deleteSpaceSecret({
				repo,
				key: "MY_SECRET",
				accessToken: TEST_ACCESS_TOKEN,
				hubUrl: TEST_HUB_URL,
			});

			const secretsAfter = await listSpaceSecrets({
				repo,
				accessToken: TEST_ACCESS_TOKEN,
				hubUrl: TEST_HUB_URL,
			});
			assert.ok(!("MY_SECRET" in secretsAfter));
		} finally {
			await deleteRepo({
				repo,
				accessToken: TEST_ACCESS_TOKEN,
				hubUrl: TEST_HUB_URL,
			}).catch(() => undefined);
		}
	});

	it("should add, list and delete a variable on a space", async () => {
		const repoName = `${TEST_USER}/TEST-${insecureRandomString()}`;
		const repo = { type: "space", name: repoName } satisfies RepoId;

		try {
			await createRepo({
				accessToken: TEST_ACCESS_TOKEN,
				hubUrl: TEST_HUB_URL,
				repo,
				sdk: "static",
			});

			const afterAdd = await addSpaceVariable({
				repo,
				key: "MY_VARIABLE",
				value: "some-value",
				accessToken: TEST_ACCESS_TOKEN,
				hubUrl: TEST_HUB_URL,
			});
			assert.equal(afterAdd.MY_VARIABLE?.value, "some-value");

			const variables = await listSpaceVariables({
				repo,
				accessToken: TEST_ACCESS_TOKEN,
				hubUrl: TEST_HUB_URL,
			});
			assert.equal(variables.MY_VARIABLE?.value, "some-value");

			const afterDelete = await deleteSpaceVariable({
				repo,
				key: "MY_VARIABLE",
				accessToken: TEST_ACCESS_TOKEN,
				hubUrl: TEST_HUB_URL,
			});
			assert.ok(!("MY_VARIABLE" in afterDelete));
		} finally {
			await deleteRepo({
				repo,
				accessToken: TEST_ACCESS_TOKEN,
				hubUrl: TEST_HUB_URL,
			}).catch(() => undefined);
		}
	});
});
