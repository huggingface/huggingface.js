import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { McpClient } from "../src";

/**
 * The spawned "server" is not an MCP server: it only dumps PATH and MYVAR from the environment it received and exits,
 * so `addMcpServer` rejects after the child has run. We only care about the env the child saw.
 */
const DUMP_ENV_SCRIPT =
	"require('fs').writeFileSync(process.argv[1], JSON.stringify({ PATH: process.env.PATH, MYVAR: process.env.MYVAR }))";

describe("McpClient stdio server environment", () => {
	let dir: string;
	let outFile: string;

	beforeEach(() => {
		dir = mkdtempSync(join(tmpdir(), "mcp-client-env-"));
		outFile = join(dir, "env.json");
	});

	afterEach(() => {
		rmSync(dir, { recursive: true, force: true });
	});

	async function spawnAndReadEnv(
		env: Record<string, string> | undefined,
		wrap: boolean,
	): Promise<{ PATH?: string; MYVAR?: string }> {
		const client = new McpClient({ provider: "together", model: "some/model" });
		const params = { command: process.execPath, args: ["-e", DUMP_ENV_SCRIPT, outFile], env };
		await client.addMcpServer(wrap ? { type: "stdio", config: params } : params).catch(() => undefined);
		return JSON.parse(readFileSync(outFile, "utf8"));
	}

	for (const wrap of [false, true]) {
		describe(wrap ? "ServerConfig of type stdio" : "StdioServerParameters", () => {
			it("keeps a PATH given in the server env", async () => {
				const env = await spawnAndReadEnv({ PATH: "/my/custom/bin", MYVAR: "1" }, wrap);
				expect(env.PATH).toBe("/my/custom/bin");
				expect(env.MYVAR).toBe("1");
			});

			it("still passes the parent PATH when the server env has none", async () => {
				const env = await spawnAndReadEnv({ MYVAR: "1" }, wrap);
				expect(env.PATH).toBe(process.env.PATH);
				expect(env.MYVAR).toBe("1");
			});

			it("still passes the parent PATH when no env is given", async () => {
				const env = await spawnAndReadEnv(undefined, wrap);
				expect(env.PATH).toBe(process.env.PATH);
			});
		});
	}
});
