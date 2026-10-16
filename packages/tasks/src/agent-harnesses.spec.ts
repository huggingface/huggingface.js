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
		["grok-build", "cursor-cli"],
		["junie", "cursor-cli"],
		["kimi", "cursor-cli"],
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
});
