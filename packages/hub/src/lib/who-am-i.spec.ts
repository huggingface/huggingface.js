import { expect, it, describe } from "vitest";
import { TEST_ACCESS_TOKEN, TEST_HUB_URL } from "../test/consts";
import { whoAmI } from "./who-am-i";

describe("whoAmI", () => {
	it("should fetch identity info", async () => {
		const info = await whoAmI({ accessToken: TEST_ACCESS_TOKEN, hubUrl: TEST_HUB_URL });

		if (info.auth.accessToken?.createdAt instanceof Date) {
			info.auth.accessToken.createdAt = new Date(0);
		}

		expect(info).toEqual({
			type: "user",
			id: "62f264b9f3c90f4b6514a269",
			name: "hub.js",
			fullname: "@huggingface/hub CI bot",
			email: "eliott@huggingface.co",
			emailVerified: true,
			canPay: false,
			isPro: false,
			periodEnd: null,
			avatarUrl: expect.stringMatching(/^\/avatars\//),
			billingMode: "postpaid",
			orgs: [],
			auth: {
				type: "access_token",
				accessToken: {
					createdAt: new Date(0),
					displayName: "ci-hub.js",
					role: "write",
				},
			},
		});
	});
});
