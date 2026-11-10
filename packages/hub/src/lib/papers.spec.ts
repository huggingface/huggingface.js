import { assert, it, describe } from "vitest";
import { TEST_ACCESS_TOKEN, TEST_HUB_URL } from "../test/consts";
import { listDailyPapers, listPapers, paperInfo } from "./papers";

describe("papers", () => {
	it("should list daily papers (E2E on hub-ci)", async () => {
		const papers = await listDailyPapers({
			accessToken: TEST_ACCESS_TOKEN,
			hubUrl: TEST_HUB_URL,
		});
		assert.ok(Array.isArray(papers));
	});

	it("should serialize daily paper filters as query params", async () => {
		let calledUrl = "";
		await listDailyPapers({
			date: "2026-11-01",
			week: "2026-W44",
			sort: "trending",
			limit: 10,
			p: 2,
			accessToken: "hf_test_token",
			fetch: async (url) => {
				calledUrl = String(url);
				return new Response("[]", { headers: { "Content-Type": "application/json" } });
			},
		});
		assert.equal(
			calledUrl,
			"https://huggingface.co/api/daily_papers?p=2&limit=10&sort=trending&date=2026-11-01&week=2026-W44",
		);
	});

	it("should search papers", async () => {
		let calledUrl = "";
		const results = await listPapers({
			query: "attention is all you need",
			limit: 5,
			accessToken: "hf_test_token",
			fetch: async (url) => {
				calledUrl = String(url);
				return new Response(
					JSON.stringify([
						{
							paper: { id: "1706.03762", title: "Attention Is All You Need", upvotes: 5000 },
							title: "Attention Is All You Need",
							highlightedTitle: "<b>Attention</b> Is All You Need",
						},
					]),
					{ headers: { "Content-Type": "application/json" } },
				);
			},
		});
		assert.equal(calledUrl, "https://huggingface.co/api/papers/search?q=attention+is+all+you+need&limit=5");
		assert.equal(results[0].paper.id, "1706.03762");
	});

	it("should fetch paper info by id", async () => {
		let calledUrl = "";
		const info = await paperInfo({
			id: "1706.03762",
			accessToken: "hf_test_token",
			fetch: async (url) => {
				calledUrl = String(url);
				return new Response(
					JSON.stringify({
						id: "1706.03762",
						title: "Attention Is All You Need",
						authors: [{ name: "Ashish Vaswani" }],
						upvotes: 5000,
					}),
					{ headers: { "Content-Type": "application/json" } },
				);
			},
		});
		assert.equal(calledUrl, "https://huggingface.co/api/papers/1706.03762");
		assert.equal(info.title, "Attention Is All You Need");
		assert.equal(info.authors?.[0].name, "Ashish Vaswani");
	});
});
