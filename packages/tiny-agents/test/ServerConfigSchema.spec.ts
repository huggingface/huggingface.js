import { describe, expect, it } from "vitest";
import { ServerConfigSchema } from '../src/lib/types.js';

describe("ServerConfigSchema", () => {
	it("You can parse a server config", async () => {
		const config = ServerConfigSchema.parse({
			type: "stdio",
			config: {
				command: "npx",
				args: ["@playwright/mcp@latest"],
			},
		});
		expect(config).toBeDefined();
		expect(config.type).toBe("stdio");
	});
});
