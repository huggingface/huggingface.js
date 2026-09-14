import { beforeEach, describe, expect, it, vi } from "vitest";
import { McpClient } from "../src";

const mcpClientMocks = vi.hoisted(() => ({
	close: vi.fn(),
	connect: vi.fn(),
	listTools: vi.fn().mockResolvedValue({ tools: [] }),
}));

vi.mock("@modelcontextprotocol/sdk/client/index.js", () => ({
	Client: class {
		connect(...args: unknown[]) {
			return mcpClientMocks.connect(...args);
		}

		listTools(...args: unknown[]) {
			return mcpClientMocks.listTools(...args);
		}

		close(...args: unknown[]) {
			return mcpClientMocks.close(...args);
		}
	},
}));

if (!process.env.HF_TOKEN) {
	console.warn("Set HF_TOKEN in the env to run the tests for better rate limits");
}

describe("McpClient", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("You can create a mcp client", async () => {
		const client = new McpClient({
			provider: "together",
			model: "Qwen/Qwen2.5-72B-Instruct",
			apiKey: process.env.HF_TOKEN,
		});
		expect(client).toBeDefined();
		expect(client.availableTools.length).toBe(0);
	});

	it("closes connected MCP servers that expose no tools", async () => {
		const client = new McpClient({
			provider: "together",
			model: "Qwen/Qwen2.5-72B-Instruct",
		});

		await client.addMcpServer({ command: "unused" });
		await client.cleanup();

		expect(mcpClientMocks.close).toHaveBeenCalledOnce();
	});
});
