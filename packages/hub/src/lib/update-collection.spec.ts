import { it, describe } from "vitest";

import { TEST_ACCESS_TOKEN, TEST_HUB_URL } from "../test/consts";
// import type { Credentials } from "../types/public";
// import { createCollection } from "./create-collection";
import { updateCollection } from "./update-collection";
// import { type WhoAmI, whoAmI } from "./who-am-i";

describe("createCollection", () => {
	it("should update a collection", async () => {
		// const info: WhoAmI = await whoAmI({ credentials: { accessToken: TEST_ACCESS_TOKEN }, hubUrl: TEST_HUB_URL });
		const result = await updateCollection({
			slug: "hub.js/this-is-new-collection-65673aad5c9bf462f0d7a254",
			title: "This is First collection",
			description: "First Description More",
			// position: params.position,
			private: true,
			// theme: params.theme,
			credentials: { accessToken: TEST_ACCESS_TOKEN },
			hubUrl: TEST_HUB_URL,
		});

		console.log(result);
	}, 25000);
});
