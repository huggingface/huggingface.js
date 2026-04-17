import { describe, expect, it } from "vitest";
import { McpClient } from "../src";

if (!process.env.HF_TOKEN) {
	console.warn("Set HF_TOKEN in the env to run the tests for better rate limits");
}

describe("McpClient", () => {
	it("You can create a mcp client", async () => {
		const client = new McpClient({
			provider: "together",
			model: "Qwen/Qwen2.5-72B-Instruct",
			apiKey: process.env.HF_TOKEN,
		});
		expect(client).toBeDefined();
		expect(client.availableTools.length).toBe(0);
	});
});
