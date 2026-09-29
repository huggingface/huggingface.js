import { assert, it, describe } from "vitest";
import { countCommits } from "./count-commits";

describe("countCommits", () => {
	it("should fetch paginated commits from the repo", async () => {
		const count = await countCommits({
			repo: {
				name: "openai-community/gpt2",
				type: "model",
			},
			revision: "607a30d783dfa663caf39e06633721c8d4cfcd7e",
		});

		assert.equal(count, 26);
	});

	it("should URL-encode the revision", async () => {
		const urls: string[] = [];
		const count = await countCommits({
			repo: {
				name: "openai-community/gpt2",
				type: "model",
			},
			revision: "refs/pr/1",
			fetch: async (url) => {
				urls.push(String(url));
				return new Response(null, { headers: { "x-total-count": "3" } });
			},
		});

		assert.equal(count, 3);
		assert.deepStrictEqual(urls, [
			"https://huggingface.co/api/models/openai-community/gpt2/commits/refs%2Fpr%2F1?limit=1",
		]);
	});
});
