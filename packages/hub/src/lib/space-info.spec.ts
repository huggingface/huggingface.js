import { describe, expect, it } from "vitest";
import { spaceInfo } from "./space-info";

describe("spaceInfo", () => {
	it("should return the space info", async () => {
		const info = await spaceInfo({
			name: "huggingfacejs/client-side-oauth",
		});
		expect(info).toEqual({
			id: "659835e689010f9c7aed608d",
			name: "huggingfacejs/client-side-oauth",
			updatedAt: expect.any(Date),
			likes: expect.any(Number),
			private: false,
			sdk: "static",
		});
	});
});
