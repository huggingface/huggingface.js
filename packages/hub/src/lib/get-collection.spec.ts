import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { TEST_ACCESS_TOKEN, TEST_HUB_URL, TEST_USER } from "../test/consts";
import { getCollection } from "./get-collection";
import { insecureRandomString } from "../utils/insecureRandomString";
import { listCollections } from "./list-collections";
import { deleteCollection } from "./delete-collection";
import { createCollection } from "./create-collection";
//

describe("getCollection", () => {
	const credentials = {
		accessToken: TEST_ACCESS_TOKEN,
	};
	const title = "This is a new test collection " + insecureRandomString();
	const description = "Test collection";

	const cleanUp = async () => {
		const list = listCollections({
			search: {
				q: title,
			},
			credentials,
			hubUrl: TEST_HUB_URL,
		});
		for await (const item of list) {
			await deleteCollection({
				slug: item.slug,
				missing_ok: true,
				credentials,
				hubUrl: TEST_HUB_URL,
			});
		}
	};

	beforeAll(cleanUp);
	afterAll(cleanUp);

	it("should get existing collection", async () => {
		const res = await createCollection({
			title,
			description,
			private: false,
			exists_ok: false,
			namespace: TEST_USER,
			credentials,
			hubUrl: TEST_HUB_URL,
		});

		const col = await getCollection({
			slug: res.slug,
			credentials,
			hubUrl: TEST_HUB_URL,
		});

		expect(col).toMatchObject({
			title,
			description,
			private: false,
		});
	});

	it("should return error for non-existing collection", async () => {
		await expect(
			getCollection({
				slug: "blah",
				credentials,
				hubUrl: TEST_HUB_URL,
			})
		).rejects.toThrowError("Sorry, we can't find the page you are looking for.");
	});
});
