import { it, describe } from "vitest";

import { TEST_ACCESS_TOKEN, TEST_HUB_URL } from "../test/consts";
// import type { Credentials } from "../types/public";
import { createCollection } from "./create-collection";
import { type WhoAmI, whoAmI } from "./who-am-i";

describe("createCollection", () => {
	it("should create a collection", async () => {
		const info: WhoAmI = await whoAmI({ credentials: { accessToken: TEST_ACCESS_TOKEN }, hubUrl: TEST_HUB_URL });
		const result = await createCollection({
			title: "This is Fourth collection",
			namespace: info.name,
			description: "Fourth Description",
			private: false,
			exists_ok: false,
			credentials: { accessToken: TEST_ACCESS_TOKEN },
			hubUrl: TEST_HUB_URL,
		});

		console.log(result);
	}, 25000);
});
