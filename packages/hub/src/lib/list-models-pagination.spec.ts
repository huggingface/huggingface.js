import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { listModels } from "../../index";

const next = "https://hub.example/api/models?page=2";

beforeEach(() => {
	vi.stubGlobal("fetch", () => {
		throw new Error("Only the custom fixture fetch should be used");
	});
});

afterEach(() => {
	vi.unstubAllGlobals();
});

async function collectModels(link?: string, limit?: number) {
	const requests: string[] = [];
	const customFetch: typeof fetch = async (input) => {
		requests.push(String(input));
		if (requests.length > 2) {
			throw new Error("Unexpected third page");
		}
		if (requests.length === 2) {
			expect(String(input)).toBe(next);
		}
		const page = requests.length;
		return new Response(
			JSON.stringify([
				{
					_id: String(page).padStart(24, "0"),
					id: `fixture/model-${page}`,
					private: false,
					gated: false,
					downloads: page,
					likes: page,
					lastModified: "2026-11-03T00:00:00.000Z",
					pipeline_tag: "text-classification",
				},
			]),
			{
				status: 200,
				headers: { "Content-Type": "application/json", ...(page === 1 && link ? { Link: link } : {}) },
			},
		);
	};
	const names: string[] = [];
	for await (const model of listModels({ hubUrl: "https://hub.example", fetch: customFetch, limit })) {
		names.push(model.name);
	}
	return { requests, names };
}

describe("listModels Link pagination", () => {
	it.each([
		["rel first", `<${next}>; rel="next"; title="next page"`],
		["title before rel", `<${next}>; title="next page"; rel="next"`],
		["type before rel", `<${next}>; type="application/json"; rel="next"`],
		["quoted separators", `<${next}>; title="next, page; of models"; rel="next"`],
		["target-like title", String.raw`<${next}>; title="<https://wrong.example/>; rel=\"prev\""; rel="next"`],
	])("reads both pages with %s", async (_, link) => {
		const { requests, names } = await collectModels(link);
		expect(requests).toHaveLength(2);
		expect(names).toEqual(["fixture/model-1", "fixture/model-2"]);
	});

	it("stops when no Link header is present", async () => {
		const { requests, names } = await collectModels();
		expect(requests).toHaveLength(1);
		expect(names).toEqual(["fixture/model-1"]);
	});

	it("honors the limit without fetching the next page", async () => {
		const { requests, names } = await collectModels(`<${next}>; rel="next"`, 1);
		expect(requests).toHaveLength(1);
		expect(names).toEqual(["fixture/model-1"]);
	});
});
