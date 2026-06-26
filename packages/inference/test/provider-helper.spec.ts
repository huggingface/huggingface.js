import { describe, expect, it } from "vitest";

import { getProviderHelper } from "../src/lib/getProviderHelper.js";

describe("provider helpers", () => {
	it("resolves Telnyx conversational helper with direct provider route", () => {
		const helper = getProviderHelper("telnyx", "conversational");
		const urlParams = { authMethod: "provider-key" as const, model: "telnyx/test-model" };

		expect(helper.provider).toBe("telnyx");
		expect(helper.makeBaseUrl(urlParams)).toBe("https://api.telnyx.com/v2/ai/openai");
		expect(helper.makeRoute(urlParams)).toBe("chat/completions");
		expect(helper.makeUrl(urlParams)).toBe("https://api.telnyx.com/v2/ai/openai/chat/completions");
	});
});
