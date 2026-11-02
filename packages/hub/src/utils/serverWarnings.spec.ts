import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchWithServerWarnings, resetWarnedTopics, warnOnServerWarnings } from "./serverWarnings";

function responseWithWarnings(...warnings: string[]): Response {
	const headers = new Headers();
	for (const warning of warnings) {
		headers.append("X-HF-Warning", warning);
	}
	return new Response(null, { headers });
}

describe("warnOnServerWarnings", () => {
	afterEach(() => {
		resetWarnedTopics();
		vi.restoreAllMocks();
	});

	it("should warn once per topic", () => {
		const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

		const response = responseWithWarnings(
			"This is a warning without a topic.",
			"Topic1; This is the first warning message.",
			"Topic2; This is the second warning message, with a comma.",
			"topic1; This is a repeated warning message for Topic1.",
		);
		warnOnServerWarnings(response);
		expect(warn.mock.calls).toEqual([
			["This is a warning without a topic."],
			["This is the first warning message."],
			["This is the second warning message, with a comma."],
		]);

		// Same warnings again, plus another one for an already seen topic: no new warning
		response.headers.append("X-HF-Warning", "topic2; This is another warning for Topic2.");
		warn.mockClear();
		warnOnServerWarnings(response);
		expect(warn).not.toHaveBeenCalled();

		// New topic
		warnOnServerWarnings(responseWithWarnings("Topic4; Another warning."));
		expect(warn.mock.calls).toEqual([["Another warning."]]);
	});

	it("should remember at most 100 topics and evict the oldest", () => {
		const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

		for (let i = 0; i < 1000; i++) {
			warnOnServerWarnings(responseWithWarnings(`topic${i}; Warning ${i}`));
		}
		expect(warn).toHaveBeenCalledTimes(1000);

		// All 1000 topics are still deduplicated at capacity.
		for (let i = 0; i < 1000; i++) {
			warnOnServerWarnings(responseWithWarnings(`TOPIC${i}; Repeated warning ${i}`));
		}
		expect(warn).toHaveBeenCalledTimes(1000);

		warnOnServerWarnings(responseWithWarnings("topic1000; New warning"));
		expect(warn).toHaveBeenCalledTimes(1001);
		expect(warn).toHaveBeenLastCalledWith("New warning");

		// Recent topics remain cached, while the oldest can warn again.
		for (let i = 1; i <= 1000; i++) {
			warnOnServerWarnings(responseWithWarnings(`topic${i}; Repeated warning ${i}`));
		}
		expect(warn).toHaveBeenCalledTimes(1001);
		warnOnServerWarnings(responseWithWarnings("topic0; Oldest warning again"));
		expect(warn).toHaveBeenCalledTimes(1002);
		expect(warn).toHaveBeenLastCalledWith("Oldest warning again");
	});

	it("should not warn without header", () => {
		const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
		warnOnServerWarnings(new Response(null));
		expect(warn).not.toHaveBeenCalled();
	});

	it("should warn when wrapping a custom fetch", async () => {
		const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
		const customFetch = vi.fn(async () => responseWithWarnings("deprecated; This endpoint is deprecated."));

		const response = await fetchWithServerWarnings(customFetch)("https://huggingface.co/api/whoami-v2");

		expect(customFetch).toHaveBeenCalledWith("https://huggingface.co/api/whoami-v2");
		expect(response.headers.get("X-HF-Warning")).toBe("deprecated; This endpoint is deprecated.");
		expect(warn.mock.calls).toEqual([["This endpoint is deprecated."]]);
	});
});
