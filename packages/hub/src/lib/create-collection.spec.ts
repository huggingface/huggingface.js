import { it, describe } from "vitest";
import { TEST_ACCESS_TOKEN, TEST_HUB_URL } from "../test/consts";
import { createCollection } from "./create-collection";
import { type WhoAmI, whoAmI } from "./who-am-i";

describe("createCollection", () => {
	it("should create a new collection", async () => {
		const info: WhoAmI = await whoAmI({ credentials: { accessToken: TEST_ACCESS_TOKEN }, hubUrl: TEST_HUB_URL });
		// Replace collections parameters with new values
		const result = await createCollection({
			title: "This is Sixth collection",
			namespace: info.name,
			description: "Sixth  Description",
			private: false,
			exists_ok: false,
			credentials: { accessToken: TEST_ACCESS_TOKEN },
			hubUrl: TEST_HUB_URL,
		});

		console.log(result);
	}, 25000);
	it("should get an existing collection", async () => {
		const info: WhoAmI = await whoAmI({ credentials: { accessToken: TEST_ACCESS_TOKEN }, hubUrl: TEST_HUB_URL });
		// Make Exist ok as true and give existing values for title and dscription
		const result = await createCollection({
			title: "This is Fifth collection",
			namespace: info.name,
			description: "fifth Description",
			private: false,
			exists_ok: true,
			credentials: { accessToken: TEST_ACCESS_TOKEN },
			hubUrl: TEST_HUB_URL,
		});

		console.log(result);
	}, 25000);
});
