import { it, describe, expect, beforeAll, afterAll } from "vitest";

import { TEST_ACCESS_TOKEN, TEST_HUB_URL, TEST_USER } from "../test/consts";
import { deleteCollection } from "./delete-collection";
import { insecureRandomString } from "../utils/insecureRandomString";
import { listCollections } from "./list-collections";
import { createCollection } from "./create-collection";
import { getCollection } from "./get-collection";
// import { type WhoAmI, whoAmI } from "./who-am-i";

describe("deleteCollection", () => {
	const credentials = {
		accessToken: TEST_ACCESS_TOKEN,
	};
	const hubUrl = TEST_HUB_URL;
	const title = "This is a new test collection " + insecureRandomString();
	const description = "Test collection";
	const namespace = TEST_USER;

	const cleanUp = async () => {
		const list = listCollections({
			search: {
				q: title,
			},
			credentials,
			hubUrl,
		});
		for await (const item of list) {
			await deleteCollection({
				slug: item.slug,
				missing_ok: true,
				credentials,
				hubUrl,
			});
		}
	};

	beforeAll(cleanUp);
	afterAll(cleanUp);

	it("should delete a collection", async () => {
		const col = await createCollection({
			title,
			description,
			namespace,
			private: false,
			exists_ok: false,
			credentials,
			hubUrl,
		});

		await deleteCollection({
			slug: col.slug,
			missing_ok: false,
			credentials,
			hubUrl,
		});

		await expect(
			getCollection({
				slug: col.slug,
				credentials,
				hubUrl,
			})
		).rejects.toThrow();
	});
});
