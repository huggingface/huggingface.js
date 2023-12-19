import { it, describe, beforeAll, afterAll, expect } from "vitest";
import { TEST_ACCESS_TOKEN, TEST_HUB_URL, TEST_USER } from "../test/consts";
import { createCollection } from "./create-collection";
import { deleteCollection } from "./delete-collection";
import { getCollection } from "./get-collection";
import { listCollections } from "./list-collections";
import { insecureRandomString } from "../utils/insecureRandomString";

describe("createCollection", () => {
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

	it("should create a new collection", async () => {
		const result = await createCollection({
			title,
			namespace: TEST_USER,
			description,
			private: false,
			exists_ok: false,
			credentials,
			hubUrl: TEST_HUB_URL,
		});

		const col = await getCollection({
			slug: result.slug,
			credentials,
			hubUrl: TEST_HUB_URL,
		});

		expect(col).toMatchObject({
			title,
			description,
			owner: { name: TEST_USER },
			private: false,
		});
	});

	it("should return existing collection when exists_ok is true", async () => {
		const otherTitle = title + ": test exists_ok";

		const createResult = await createCollection({
			title: otherTitle,
			namespace: TEST_USER,
			description,
			private: false,
			exists_ok: false,
			credentials,
			hubUrl: TEST_HUB_URL,
		});

		const getResult = await getCollection({
			slug: createResult.slug,
			credentials,
			hubUrl: TEST_HUB_URL,
		});

		const createResult2 = await createCollection({
			title: otherTitle,
			namespace: TEST_USER,
			description,
			private: false,
			exists_ok: true,
			credentials,
			hubUrl: TEST_HUB_URL,
		});

		expect(createResult2).deep.equal(getResult);
	});
});
