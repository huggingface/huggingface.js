import { describe, it } from "vitest";
import { TEST_ACCESS_TOKEN, TEST_HUB_URL } from "../test/consts";
import { listCollections } from "./list-collections";

describe("listCollections", () => {
	it("should fetch list of collections", async () => {
		for await (const entry of listCollections({
			credentials: {
				accessToken: TEST_ACCESS_TOKEN,
			},
			hubUrl: TEST_HUB_URL,
		})) {
			// TODO
			console.log(entry);
		}
	});
});
