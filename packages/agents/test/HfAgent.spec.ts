import { describe, expect, it } from "vitest";
import { HfAgent, defaultTools, LLMFromHub, LLMFromEndpoint } from "../src";
import type { Data } from "../src/types";
import type { HfInference } from "@huggingface/inference";

const env = import.meta.env;
if (!env.HF_TOKEN) {
	console.warn("Set HF_TOKEN in the env to run the tests for better rate limits");
}

describe("HfAgent", () => {
	it("You can create an agent from the hub", async () => {
		const llm = LLMFromHub(env.HF_TOKEN, "OpenAssistant/oasst-sft-4-pythia-12b-epoch-3.5");
		const agent = new HfAgent(env.HF_TOKEN, llm);
		expect(agent).toBeDefined();
	});

	it("You can create an agent from an endpoint", async () => {
		const llm = LLMFromEndpoint(env.HF_TOKEN ?? "", "endpoint");
		const agent = new HfAgent(env.HF_TOKEN, llm);
		expect(agent).toBeDefined();
	});

	it("You can use a custom tool in your agent", async () => {
		const uppercaseTool = {
			name: "uppercase",
			description: "uppercase the input",
			examples: [
				{
					prompt: "uppercase hello world",
					code: `const output = uppercase("hello world")`,
					tools: ["uppercase"],
				},
			],
			// eslint-disable-next-line @typescript-eslint/no-unused-vars
			call: async (input: Promise<Data>, inference: HfInference): Promise<Data> => {
				const data = await input;
				if (typeof data !== "string") {
					throw new Error("Input must be a string");
				}
				return data.toUpperCase();
			},
		};

		const agent = new HfAgent(env.HF_TOKEN, undefined, [uppercaseTool, ...defaultTools]);
		const code = `
async function generate() {
	const output = uppercase("hello friends");
	message(await output);
}`;
		await agent.evaluateCode(code).then((output) => {
			expect(output.length).toBeGreaterThan(0);
			expect(output[0].message).toBe("HELLO FRIENDS");
		});
	});

	it("The agent can run custom code", async () => {
		const code = `
async function generate() {
	const output = "hello world";
	message(output);
}`;

		const agent = new HfAgent(env.HF_TOKEN);

		await agent.evaluateCode(code).then((output) => {
			expect(output.length).toBeGreaterThan(0);
			expect(output[0].message).toBe("hello world");
		});
	});

	it("The agent handles error gracefully", async () => {
		const code = `
async function generate() {
	toolThatDoesntExist(aaa);
}`;

		const hf = new HfAgent(env.HF_TOKEN);

		await hf.evaluateCode(code).then((output) => {
			expect(output.length).toBeGreaterThan(0);
			expect(output[0].message).toBe("An error occurred");
		});
	});
});
