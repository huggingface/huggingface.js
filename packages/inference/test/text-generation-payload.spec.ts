import { describe, expect, it } from "vitest";
import { ScalewayTextGenerationTask } from "../src/providers/scaleway.js";
import { TogetherTextGenerationTask } from "../src/providers/together.js";
import { FeatherlessAITextGenerationTask } from "../src/providers/featherless-ai.js";

const tasks = [
	["together", new TogetherTextGenerationTask()],
	["scaleway", new ScalewayTextGenerationTask()],
	["featherless-ai", new FeatherlessAITextGenerationTask()],
] as const;

describe.each(tasks)("%s text generation payload", (_name, task) => {
	it("flattens parameters and maps max_new_tokens to max_tokens", () => {
		const payload = task.preparePayload({
			args: { inputs: "Hello", parameters: { max_new_tokens: 7, temperature: 0.5 } },
			model: "provider-model",
			task: "text-generation",
			mapping: undefined,
			accessToken: "token",
			authMethod: "provider-key",
		} as never);
		expect(payload).toEqual({ model: "provider-model", max_tokens: 7, temperature: 0.5, prompt: "Hello" });
		expect(payload).not.toHaveProperty("parameters");
		expect(payload).not.toHaveProperty("inputs");
	});

	it("works without parameters", () => {
		const payload = task.preparePayload({ args: { inputs: "Hi" }, model: "provider-model" } as never);
		expect(payload).toEqual({ model: "provider-model", prompt: "Hi" });
	});
});
