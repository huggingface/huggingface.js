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

	it("uses only fields understood by existing registry consumers", () => {
		const supportedFields = ["prettyLabel", "repoUrl", "docsUrl", "description", "envVars"];
		for (const harness of Object.values(harnesses)) {
			for (const field of Object.keys(harness)) {
				expect(supportedFields).toContain(field);
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
		["cue", "claude-code"],
		["muse", "claude-code"],
		["manus-studio", "claude-code"],
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
	function matchesHarness(harness: AgentHarness, env: Record<string, string>): boolean {
		const matchesEntry = ([name, pattern]: [string, string]): boolean => {
			const value = env[name];
			return !!value && (pattern === "*" || pattern === value);
		};
		return Object.entries(harness.envVars ?? {}).some(matchesEntry);
	}

	function matchEnvironment(env: Record<string, string>): string | undefined {
		return Object.entries(harnesses).find(([, harness]) => matchesHarness(harness, env))?.[0];
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
		// Shared sandbox flags cannot refine Cursor without a dedicated marker in the existing format.
		[{ CURSOR_AGENT: "1", SAND_MANIFEST_V2: "1", SAND_SUPERVISOR_ENABLED: "1" }, "cursor-cli"],
		[{ SAND_AGENT: "1", SAND_MANIFEST_V2: "0", SAND_SUPERVISOR_ENABLED: "0" }, "grok-bot"],
		[{ CURSOR_AGENT: "1" }, "cursor-cli"],
		[{ SAND_MANIFEST_V2: "1" }, undefined],
		[{ SAND_SUPERVISOR_ENABLED: "1" }, undefined],
		[{ SAND_MANIFEST_V2: "1", SAND_SUPERVISOR_ENABLED: "1" }, undefined],
		[{ CURSOR_AGENT: "1", SAND_SUPERVISOR_ENABLED: "1" }, "cursor-cli"],
		[{ CURSOR_AGENT: "1", SAND_MANIFEST_V2: "1" }, "cursor-cli"],
		[{ CURSOR_AGENT: "", SAND_MANIFEST_V2: "1", SAND_SUPERVISOR_ENABLED: "1" }, undefined],
		[{ CURSOR_AGENT: "1", SAND_MANIFEST_V2: "0", SAND_SUPERVISOR_ENABLED: "1" }, "cursor-cli"],
		[{ CURSOR_AGENT: "1", SAND_MANIFEST_V2: "1", SAND_SUPERVISOR_ENABLED: "0" }, "cursor-cli"],
		[{ CURSOR_AGENT: "1", SAND_MANIFEST_V2: "true", SAND_SUPERVISOR_ENABLED: "1" }, "cursor-cli"],
		[{ CURSOR_AGENT: "1", SAND_MANIFEST_V2: "1", SAND_SUPERVISOR_ENABLED: "true" }, "cursor-cli"],
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
		[{ MANUS_LONG_DESKTOP_WORKER: "1" }, "cue"],
		[{ MANUS_LONG_DESKTOP_WORKER: "1", CLAUDECODE: "1", CURSOR_AGENT: "1" }, "cue"],
		[{ MANUS_LONG_DESKTOP_WORKER: "true" }, undefined],
		[{ MANUS_LONG_DESKTOP_WORKER: "0" }, undefined],
		[{ MANUS_LONG_DESKTOP_WORKER: "" }, undefined],
		[{ MANUS_CONFIG_DIR: "/tmp/example-config" }, undefined],
		[{ MANUS_ADDON_RUNTIME_SPEC_PATH: "/tmp/synthetic-spec.json" }, "manus-studio"],
		[{ MANUS_ADDON_RUNTIME_SPECS_REVISION: "synthetic-revision" }, "manus-studio"],
		[{ MANUS_ADDON_RUNTIME_SPEC_PATH: "" }, undefined],
		[{ MANUS_ADDON_RUNTIME_SPECS_REVISION: "" }, undefined],
		[{ MANUS_ADDON_PREVIEW_PUBLIC_ORIGIN: "https://preview.example.test" }, undefined],
		[{ MANUS_ADDON_REGISTRY_ENABLED: "1" }, undefined],
		[{ MANUS_ADDON_RUNTIME_PUBLIC_ORIGIN: "https://runtime.example.test" }, undefined],
		[{ MANUS_ADDON_SERVER_BRANCH: "synthetic-branch" }, undefined],
		[{ MANUS_GROUP_ENABLED: "1" }, undefined],
		[{ JARVIS_IS_ASSIGNED: "1" }, "muse"],
		[{ JARVIS_TOOL_CALL_ID: "synthetic-tool-call" }, "muse"],
		[{ JARVIS_IS_ASSIGNED: "1", CLAUDECODE: "1" }, "muse"],
		[{ JARVIS_IS_ASSIGNED: "0" }, undefined],
		[{ JARVIS_IS_ASSIGNED: "true" }, undefined],
		[{ JARVIS_IS_ASSIGNED: "" }, undefined],
		[{ JARVIS_TOOL_CALL_ID: "" }, undefined],
		[{ JARVIS_HATCHLING_ID: "synthetic-vm" }, undefined],
		[{ JARVIS_SESSION_ID: "synthetic-session" }, undefined],
		[{ JARVIS_TIER: "pro" }, undefined],
		[{ JARVIS_USER_TIMEZONE: "UTC" }, undefined],
		[{ JARVIS_VM_COMPUTE_REGION: "test-region" }, undefined],
		[
			{
				JARVIS_HATCHLING_ID: "synthetic-vm",
				JARVIS_SESSION_ID: "synthetic-session",
				JARVIS_TIER: "pro",
				JARVIS_USER_TIMEZONE: "UTC",
				JARVIS_VM_COMPUTE_REGION: "test-region",
			},
			undefined,
		],
	])("matches synthetic environment %j as %s", (env, expected) => {
		expect(matchEnvironment(env)).toBe(expected);
	});
});
