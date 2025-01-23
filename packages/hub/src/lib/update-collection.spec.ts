import { it, describe, beforeAll, afterAll, expect } from "vitest";

import { TEST_ACCESS_TOKEN, TEST_HUB_URL, TEST_USER } from "../test/consts";
// import type { Credentials } from "../types/public";
// import { createCollection } from "./create-collection";
import { updateCollection } from "./update-collection";
import { insecureRandomString } from "../utils/insecureRandomString";
import { listCollections } from "./list-collections";
import { deleteCollection } from "./delete-collection";
import { createCollection } from "./create-collection";
import { getCollection } from "./get-collection";
// import { type WhoAmI, whoAmI } from "./who-am-i";

describe("updateCollection", () => {
	const credentials = {
		accessToken: TEST_ACCESS_TOKEN,
	};
	const hubUrl = TEST_HUB_URL;
	const title = "This is a new test collection " + insecureRandomString();
	const description = "Test collection";

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

	it("should update a collection", async () => {
		const res = await createCollection({
			title,
			description,
			namespace: TEST_USER,
			private: false,
			exists_ok: false,
			credentials,
			hubUrl,
		});

		await updateCollection({
			slug: res.slug,
			title: title + " updated!",
			description: "Updated description",
			// position: params.position,
			private: true,
			// theme: params.theme,
			credentials,
			hubUrl,
		});

		const col = await getCollection({
			slug: res.slug,
			credentials,
			hubUrl,
		});

		expect(col).toMatchObject({
			title: title + " updated!",
			description: "Updated description",
			private: true,
		});
	});
});
