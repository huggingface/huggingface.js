import { expect, test } from "vitest";
import { AGENT_HARNESSES } from "./agent-harnesses.js";
test("DeepSeek uses the execution sentinel, not home/session configuration", () => {
	expect(AGENT_HARNESSES["deepseek-harness"].envVars).toEqual({ DSH_SHELL: "*" });
	const keys = Object.keys(AGENT_HARNESSES);
	expect(keys.indexOf("codex")).toBeLessThan(keys.indexOf("deepseek-harness"));
	expect(keys.indexOf("cursor-cli")).toBeLessThan(keys.indexOf("deepseek-harness"));
	expect(keys.indexOf("deepseek-harness")).toBeLessThan(keys.indexOf("cursor"));
});
