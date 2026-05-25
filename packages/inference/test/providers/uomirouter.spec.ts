import { describe, expect, it } from "vitest";
import { UomiRouterConversationalTask } from "../../src/providers/uomirouter.js";
import { getProviderHelper } from "../../src/lib/getProviderHelper.js";

/**
 * Self-contained unit tests for the UomiRouter provider helper.
 *
 * These don't hit the network — they validate that:
 *  1. the helper class can be instantiated,
 *  2. it advertises the correct provider id and OpenAI-compatible chat route,
 *  3. it resolves to a `https://gateway.uomi.ai/v1/chat/completions` URL when the
 *     caller authenticates with a provider key (i.e. their own `sk-uomi-*` token),
 *  4. it is wired into the central `PROVIDERS` registry.
 *
 * End-to-end behavior (streaming, tool calling, structured output) is covered
 * by the live-network suite in `InferenceClient.spec.ts` when `HF_UOMIROUTER_KEY`
 * is present in the environment.
 */
describe("UomiRouter provider helper", () => {
	it("constructs with the correct provider id and base URL", () => {
		const helper = new UomiRouterConversationalTask();
		expect(helper.provider).toBe("uomirouter");
	});

	it("targets the OpenAI-compatible chat completions route", () => {
		const helper = new UomiRouterConversationalTask();
		expect(helper.makeRoute()).toBe("v1/chat/completions");
	});

	it("builds the full provider URL when using a provider key", () => {
		const helper = new UomiRouterConversationalTask();
		const url = helper.makeUrl({
			accessToken: "sk-uomi-test",
			authMethod: "provider-key",
			model: "Qwen/Qwen3.6-27B",
			task: "conversational",
		});
		expect(url).toBe("https://gateway.uomi.ai/v1/chat/completions");
	});

	it("is registered in the central PROVIDERS map for conversational", () => {
		const helper = getProviderHelper("uomirouter", "conversational");
		expect(helper).toBeInstanceOf(UomiRouterConversationalTask);
	});
});
