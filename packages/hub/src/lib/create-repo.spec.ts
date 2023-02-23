import { randomBytes } from "crypto";
import { TEST_ACCESS_TOKEN, TEST_USER } from "../consts";
import { createRepo } from "./create-repo";
import { deleteRepo } from "./delete-repo";

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
		});

		await deleteRepo({
			repo: {
				name: repoName,
				type: "model",
			},
			credentials: { accessToken: TEST_ACCESS_TOKEN },
		});
	});
});
