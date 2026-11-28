import { describe, expect, it, vi } from "vitest";
import { McpClient } from "../src";

const listTools = vi.hoisted(() => vi.fn());

vi.mock("@modelcontextprotocol/sdk/client/index.js", () => ({
	Client: class {
		connect = vi.fn();
		listTools = listTools;
	},
}));

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

	it("registers the tools from every page of tools/list", async () => {
		const tool = (name: string) => ({ name, inputSchema: { type: "object" } });
		listTools.mockImplementation(async (params?: { cursor?: string }) =>
			params?.cursor === "page-2" ? { tools: [tool("second")] } : { tools: [tool("first")], nextCursor: "page-2" },
		);
		const client = new McpClient({ provider: "together", model: "Qwen/Qwen2.5-72B-Instruct" });

		await client.addMcpServer({ command: "unused" });

		expect(client.availableTools.map((t) => t.function.name)).toEqual(["first", "second"]);
	});
});
