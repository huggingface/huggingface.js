/**
 * Registry of AI coding agents / harnesses known to use the Hugging Face Hub.
 *
 * To add your harness, append an entry below keyed by its `id` (the name used
 * when reporting Hub activity), and list the environment variable(s) that
 * identify it.
 */
export interface AgentHarness {
	/**
	 * Human-readable name of the harness, e.g. displayed in a leaderboard.
	 */
	prettyLabel: string;
	/**
	 * URL to the harness's code repository (usually on GitHub).
	 */
	repoUrl?: string;
	/**
	 * URL to the harness's documentation or website.
	 */
	docsUrl?: string;
	/**
	 * Short description of the harness.
	 */
	description?: string;
	/**
	 * Environment variable(s) that identify this harness, mapped to the value
	 * pattern they must match. Detection matches if ANY entry matches.
	 *
	 * The value pattern is one of:
	 *  - `"*"`: the variable is set to any (non-empty) value
	 *  - `"<value>"`: the variable equals this exact value
	 *  - `"<prefix>*"`: the variable value starts with `<prefix>` (fuzzy match, resolved client-side)
	 *
	 * If not provided, the harness is detected through the standard AI_AGENT / AGENT variables only.
	 */
	envVars?: Record<string, string>;
}

/**
 * Standard environment variables that any tool can set to identify itself.
 * When one of these is set, its value is used directly as the agent `id`
 * (matched against the keys of `AGENT_HARNESSES`); unrecognized values are
 * reported as `"unknown"`.
 */
export const STANDARD_AGENT_ENV_VARS = ["AI_AGENT", "AGENT"] as const;

/**
 * Add your new agent harness here.
 *
 * /!\ IMPORTANT
 *
 * Insertion order matters for detection priority: harnesses are checked from
 * top to bottom and the first match wins. In particular, `cowork` must stay
 * before `claude-code` so the more specific signal takes priority when both
 * `CLAUDE_CODE` and `CLAUDE_CODE_IS_COWORK` are set.
 */
export const AGENT_HARNESSES = {
	antigravity: {
		prettyLabel: "Antigravity",
		docsUrl: "https://antigravity.google",
		description: "Agentic development platform from Google built around Gemini.",
		envVars: { ANTIGRAVITY_AGENT: "*" },
	},
	"augment-cli": {
		prettyLabel: "Augment CLI",
		repoUrl: "https://github.com/augmentcode/auggie",
		docsUrl: "https://www.augmentcode.com",
		description: "Auggie, the command-line coding agent from Augment Code.",
		envVars: { AUGMENT_AGENT: "*" },
	},
	cline: {
		prettyLabel: "Cline",
		repoUrl: "https://github.com/cline/cline",
		docsUrl: "https://cline.bot",
		description: "Open-source autonomous coding agent for VS Code.",
		envVars: { CLINE_ACTIVE: "*" },
	},
	cowork: {
		// must stay before `claude-code` so the more specific signal takes priority when both `CLAUDE_CODE` and `CLAUDE_CODE_IS_COWORK` are set.
		prettyLabel: "Cowork",
		docsUrl: "https://claude.com/product/cowork",
		description: "Anthropic's agent for autonomous knowledge work, built on top of Claude Code.",
		envVars: { CLAUDE_CODE_IS_COWORK: "*" },
	},
	"claude-code": {
		prettyLabel: "Claude Code",
		repoUrl: "https://github.com/anthropics/claude-code",
		docsUrl: "https://code.claude.com/docs",
		description: "Anthropic's agentic coding tool that lives in your terminal.",
		envVars: { CLAUDECODE: "*", CLAUDE_CODE: "*" },
	},
	codex: {
		prettyLabel: "Codex",
		repoUrl: "https://github.com/openai/codex",
		docsUrl: "https://developers.openai.com/codex",
		description: "OpenAI's lightweight coding agent that runs in your terminal.",
		envVars: { CODEX_SANDBOX: "*", CODEX_CI: "*", CODEX_THREAD_ID: "*" },
	},
	crush: {
		prettyLabel: "Crush",
		repoUrl: "https://github.com/charmbracelet/crush",
		docsUrl: "https://github.com/charmbracelet/crush",
		description: "Charm's open-source AI coding agent for the terminal.",
		// `CrushEnvMarkers()` unconditionally sets `CRUSH=1` (plus `AGENT=crush`/`AI_AGENT=crush`) on every spawned shell.
		envVars: { CRUSH: "*" },
	},
	"gemini-cli": {
		prettyLabel: "Gemini CLI",
		repoUrl: "https://github.com/google-gemini/gemini-cli",
		docsUrl: "https://geminicli.com",
		description: "Google's open-source terminal AI coding agent powered by Gemini models.",
		// `ShellExecutionService` injects `GEMINI_CLI=1` into the environment of every spawned shell command.
		envVars: { GEMINI_CLI: "*" },
	},
	"github-copilot": {
		prettyLabel: "GitHub Copilot",
		docsUrl: "https://docs.github.com/copilot",
		description: "GitHub's AI coding assistant.",
		envVars: { COPILOT_MODEL: "*", COPILOT_ALLOW_ALL: "*", COPILOT_GITHUB_TOKEN: "*" },
	},
	goose: {
		prettyLabel: "Goose",
		repoUrl: "https://github.com/aaif-goose/goose",
		docsUrl: "https://goose-docs.ai/",
		description: "Open-source, extensible AI agent, originally from Block and now part of the Agentic AI Foundation.",
		envVars: { GOOSE_TERMINAL: "*" },
	},
	"kilo-code": {
		prettyLabel: "Kilo Code",
		repoUrl: "https://github.com/Kilo-Org/kilocode",
		docsUrl: "https://kilocode.ai/docs",
		description: "Open-source agentic coding agent for VS Code, JetBrains, and the terminal.",
		// `KILOCODE_FEATURE` (e.g. `cli` / `vscode-extension`) is set in-process and inherited by shell-tool subprocesses.
		envVars: { KILOCODE_FEATURE: "*" },
	},
	kiro: {
		prettyLabel: "Kiro",
		docsUrl: "https://kiro.dev",
		description: "AWS's agentic IDE for spec-driven AI software development.",
		// `AGENT_CONTEXT_OUT` / `AGENT_DISPLAY_OUT` (FIFO paths) are exported only while the agent is driving a shell command.
		envVars: { AGENT_CONTEXT_OUT: "*" },
	},
	openclaw: {
		prettyLabel: "OpenClaw",
		repoUrl: "https://github.com/openclaw/openclaw",
		docsUrl: "https://openclaw.ai",
		description: "Open-source, self-hosted personal AI assistant that runs on your own devices.",
		envVars: { OPENCLAW_SHELL: "*" },
	},
	opencode: {
		prettyLabel: "opencode",
		repoUrl: "https://github.com/anomalyco/opencode",
		docsUrl: "https://opencode.ai",
		description: "Open-source AI coding agent built for the terminal.",
		envVars: { OPENCODE_CLIENT: "*" },
	},
	pi: {
		prettyLabel: "Pi",
		repoUrl: "https://github.com/earendil-works/pi",
		docsUrl: "https://pi.dev",
		description: "Minimal, self-extensible terminal coding agent with a unified multi-provider LLM API.",
		envVars: { PI_CODING_AGENT: "*" },
	},
	replit: {
		prettyLabel: "Replit",
		docsUrl: "https://replit.com",
		description: "Cloud development environment with an AI coding agent.",
		envVars: { REPL_ID: "*" },
	},
	trae: {
		prettyLabel: "Trae",
		docsUrl: "https://trae.ai",
		description: "AI-powered IDE from ByteDance.",
		envVars: { TRAE_AI_SHELL_ID: "*" },
	},
	warp: {
		prettyLabel: "Warp",
		repoUrl: "https://github.com/warpdotdev/Warp",
		docsUrl: "https://docs.warp.dev",
		description: "AI-powered terminal with an agentic Agent Mode.",
		// Warp shell sessions set `TERM_PROGRAM=WarpTerminal`.
		envVars: { TERM_PROGRAM: "WarpTerminal" },
	},
	zed: {
		prettyLabel: "Zed",
		repoUrl: "https://github.com/zed-industries/zed",
		docsUrl: "https://zed.dev",
		description: "High-performance code editor with an integrated AI agent panel and terminal.",
		// `insert_zed_terminal_env()` sets `ZED_TERM=true` (and `TERM_PROGRAM=zed`) on the integrated terminal.
		envVars: { ZED_TERM: "*" },
	},
	"cursor-cli": {
		// Kept near the bottom (and before `cursor`): when another agent runs inside the Cursor editor's terminal,
		// its child processes inherit `CURSOR_TRACE_ID`, so `cursor` must stay a low-priority fallback and lose to
		// the agent's own marker. `cursor-cli` is the more specific Cursor signal (`CURSOR_AGENT`), so it comes first.
		prettyLabel: "Cursor CLI",
		docsUrl: "https://cursor.com/docs/cli/overview",
		description: "Cursor's coding agent for the command line.",
		envVars: { CURSOR_AGENT: "*" },
	},
	cursor: {
		prettyLabel: "Cursor",
		docsUrl: "https://cursor.com",
		description: "AI-powered code editor.",
		envVars: { CURSOR_TRACE_ID: "*" },
	},
	devin: {
		prettyLabel: "Devin",
		docsUrl: "https://devin.ai",
		description: "Autonomous AI software engineer from Cognition.",
	},
} satisfies Record<string, AgentHarness>;

/// List of the agent harnesses known to the Hub
export type AgentHarnessKey = keyof typeof AGENT_HARNESSES;
