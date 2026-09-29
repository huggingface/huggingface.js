import { describe, expect, it } from "vitest";
import { xetWriteToken } from "./xetWriteToken";

function tokenResponse(accessToken: string): Response {
	return new Response(
		JSON.stringify({ accessToken, casUrl: "https://cas.example", exp: Math.floor(Date.now() / 1000) + 3600 }),
		{ status: 200, headers: { "content-type": "application/json" } },
	);
}

describe("xetWriteToken", () => {
	it("retries the refresh after a failed attempt instead of replaying the failure", async () => {
		// A distinct URL per test: the token cache is module-level.
		const refreshWriteTokenUrl = "https://hub.example/api/xet-write-token/retry-after-failure";
		let calls = 0;
		const customFetch: typeof fetch = async () => {
			calls++;
			if (calls === 1) {
				return new Response("boom", { status: 503 });
			}
			return tokenResponse("second-try");
		};

		const params = { accessToken: "hf_test", fetch: customFetch, xetParams: { refreshWriteTokenUrl } };

		await expect(xetWriteToken(params)).rejects.toThrow();
		await expect(xetWriteToken(params)).resolves.toEqual({ accessToken: "second-try", casUrl: "https://cas.example" });
		expect(calls).toBe(2);
	});

	it("deduplicates concurrent refreshes for the same repo", async () => {
		const refreshWriteTokenUrl = "https://hub.example/api/xet-write-token/dedupe";
		let calls = 0;
		const customFetch: typeof fetch = async () => {
			calls++;
			await new Promise((resolve) => setTimeout(resolve, 10));
			return tokenResponse("shared");
		};
		const params = { accessToken: "hf_test", fetch: customFetch, xetParams: { refreshWriteTokenUrl } };

		const [a, b] = await Promise.all([xetWriteToken(params), xetWriteToken(params)]);

		expect(a.accessToken).toBe("shared");
		expect(b.accessToken).toBe("shared");
		expect(calls).toBe(1);
	});
});
