import { describe, expect, it } from "vitest";
import { AGENT_HARNESSES, STANDARD_AGENT_ENV_VARS } from "./agent-harnesses.js";
import type { AgentHarness, AgentHarnessKey } from "./agent-harnesses.js";

describe("agent-harnesses", () => {
	const harnesses: Record<string, AgentHarness> = AGENT_HARNESSES;
	const ids = Object.keys(AGENT_HARNESSES);

	it("provides valid identifiers and non-empty environment patterns for registry consumers", () => {
		for (const [id, harness] of Object.entries(harnesses)) {
			expect(id).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
			expect(harness.prettyLabel.trim()).not.toBe("");
			for (const [name, pattern] of Object.entries(harness.envVars ?? {})) {
				expect(name).toMatch(/^[A-Z_][A-Z0-9_]*$/);
				expect(pattern).not.toBe("");
				// Standard declarations identify a harness by id, rather than by a wildcard rule.
				expect(STANDARD_AGENT_ENV_VARS).not.toContain(name);
			}
		}
	});

	it.each<[AgentHarnessKey, AgentHarnessKey]>([
		["cowork", "claude-code"],
		["grok-build", "claude-code"],
		["grok-bot", "claude-code"],
		["grok-bot", "cursor-cli"],
		["workbuddy", "claude-code"],
		["qoderwork", "claude-code"],
		["manus", "claude-code"],
		["grok-build", "cursor-cli"],
		["junie", "cursor-cli"],
		["kimi", "cursor-cli"],
		["qoderwork", "cursor-cli"],
		["cursor-cli", "cursor"],
	])("keeps %s ahead of the %s fallback", (specific, fallback) => {
		expect(ids.indexOf(specific)).toBeLessThan(ids.indexOf(fallback));
	});

	it("does not treat arbitrary Grok agent-definition selectors as agent terminal markers", () => {
		expect(AGENT_HARNESSES["grok-build"].envVars.GROK_AGENT).toBe("1");
	});

	it("does not identify Kimi from a user-configured home directory", () => {
		expect(AGENT_HARNESSES.kimi.envVars).not.toHaveProperty("KIMI_CODE_HOME");
	});

	// Exercise the registry's non-empty / exact-value contract with synthetic inputs.
	// The registry itself does not read the environment or implement client detection.
	function matchEnvironment(env: Record<string, string>): string | undefined {
		return Object.entries(harnesses).find(([, harness]) =>
			Object.entries(harness.envVars ?? {}).some(([name, pattern]) => {
				const value = env[name];
				return !!value && (pattern === "*" || pattern === value);
			}),
		)?.[0];
	}

	it.each<[Record<string, string>, string | undefined]>([
		[{ KIMI_PLUGIN_ROOT: "/tmp/example-plugin" }, "kimi"],
		[{ KIMI_PLUGIN_ROOT: "" }, undefined],
		[{ KIMI_CODE_HOME: "/tmp/example-home" }, undefined],
		[{ JUNIE_DATA: "/tmp/example-data" }, "junie"],
		[{ JUNIE_SHIM_PATH: "/tmp/example-shim", CURSOR_AGENT: "1" }, "junie"],
		[{ WORKBUDDY_APPLICATION_NAME: "WorkBuddy" }, "workbuddy"],
		[{ WORKBUDDY_APP_NAME: "WorkBuddy" }, "workbuddy"],
		[{ WORKBUDDY_APP_NAME: "WorkBuddy", CLAUDECODE: "1" }, "workbuddy"],
		[{ WORKBUDDY_APPLICATION_NAME: "OtherApp" }, undefined],
		[{ WORKBUDDY_APP_NAME: "workbuddy" }, undefined],
		[{ WORKBUDDY_CONFIG_DIR: "/tmp/example-config" }, undefined],
		[{ WORKBUDDY_IS_PACKAGED: "1" }, undefined],
		[{ WORKBUDDY_CONFIG_DIR: "/tmp/example-config", WORKBUDDY_IS_PACKAGED: "1" }, undefined],
		[{ SAND_AGENT: "1" }, "grok-bot"],
		[{ SAND_AGENT: "1", CURSOR_AGENT: "1" }, "grok-bot"],
		[{ SAND_AGENT: "0" }, undefined],
		[{ SAND_AGENT: "0", CURSOR_AGENT: "1" }, "cursor-cli"],
		[{ SAND_AGENT: "true" }, undefined],
		[{ SAND_AGENT: "" }, undefined],
		[{ GROK_AGENT: "1" }, "grok-build"],
		[{ GROK_AGENT: "custom-agent" }, undefined],
		[{ GROK_PLUGIN_ROOT: "/tmp/example-plugin", CLAUDECODE: "1" }, "grok-build"],
		[{ GROK_PLUGIN_DATA: "/tmp/example-data" }, "grok-build"],
		[{ QODERWORK_SOURCE_CHAT_ID: "synthetic-chat" }, "qoderwork"],
		[{ QODERWORK_IS_CN: "true" }, "qoderwork"],
		[{ QODERWORK_IS_CN: "true", CLAUDECODE: "1" }, "qoderwork"],
		[{ QODERWORK_IS_CN: "false" }, undefined],
		[{ QODERWORK_IS_CN: "0" }, undefined],
		[{ QODERWORK_IS_CN: "1" }, undefined],
		[{ QODERWORK_IS_CN: "" }, undefined],
		[{ QODERWORK_SOURCE_CHAT_ID: "" }, undefined],
		[{ MANUS_LONG_DESKTOP_WORKER: "1" }, "manus"],
		[{ MANUS_LONG_DESKTOP_WORKER: "1", CLAUDECODE: "1", CURSOR_AGENT: "1" }, "manus"],
		[{ MANUS_LONG_DESKTOP_WORKER: "true" }, undefined],
		[{ MANUS_LONG_DESKTOP_WORKER: "0" }, undefined],
		[{ MANUS_LONG_DESKTOP_WORKER: "" }, undefined],
		[{ MANUS_CONFIG_DIR: "/tmp/example-config" }, undefined],
	])("matches synthetic environment %j as %s", (env, expected) => {
		expect(matchEnvironment(env)).toBe(expected);
	});
});
