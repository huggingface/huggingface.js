# Agent harness detection evidence

This note records the evidence and scope for the harness rules added in this change, reviewed on 2026-10-16. Environment markers identify an execution context; they do not authenticate the immediate caller. Variables can be inherited, overridden, or set manually. Registry order preserves the existing first-match behavior and does not resolve arbitrary nested agents.

## Existing matching contract

This contribution adds registry data using the existing `envVars` format. Any matching entry identifies the harness. The rules use the already-supported non-empty (`"*"`) and exact-value patterns; no new registry fields, matching capabilities, or client changes are required.

Grok Bot is registered with its local `SAND_AGENT=1` marker. Its reported cloud-shell markers cannot safely be represented as independent alternatives and are not added as detection conditions. Updating the published registry still depends on the normal server-side rollout and client cache refresh; no deployment timing is claimed.

## Public upstream sources

| Harness      | Rule                                                                 | Source and scope                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| ------------ | -------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Kimi Code    | Non-empty `KIMI_PLUGIN_ROOT`                                         | [Official plugin documentation](https://github.com/MoonshotAI/kimi-code/blob/18c6d64272952503baccf706bff455bb6a2c488e/docs/en/customization/plugins.md#L482-L486) documents injection into enabled plugin hooks. This does not cover every ordinary shell command. `KIMI_CODE_HOME` is deliberately excluded because it can be user configuration.                                                                                                                                                                                                                                                                                                                                                                          |
| Grok Build   | `GROK_AGENT=1`, or non-empty `GROK_PLUGIN_ROOT` / `GROK_PLUGIN_DATA` | The [marker definition](https://github.com/xai-org/grok-build/blob/2bdd1d6a6369de0e8c68132ea4539e9abd9e14a8/crates/codegen/xai-grok-tools/src/util/env.rs#L31-L42) distinguishes the terminal sentinel `1` from other values used to select agent definitions. The [terminal spawn path](https://github.com/xai-org/grok-build/blob/2bdd1d6a6369de0e8c68132ea4539e9abd9e14a8/crates/codegen/xai-grok-tools/src/computer/local/terminal.rs#L3315-L3323) applies the marker after environment layering. [Plugin documentation](https://github.com/xai-org/grok-build/blob/2bdd1d6a6369de0e8c68132ea4539e9abd9e14a8/crates/codegen/xai-grok-pager/docs/user-guide/09-plugins.md#L429-L438) covers the two plugin-hook markers. |
| Junie        | Non-empty `JUNIE_DATA` / `JUNIE_SHIM_PATH`                           | The [official CLI launcher](https://github.com/JetBrains/junie/blob/cdbfbcf6a9f17951c94dd2902619dffc37f5881f/templates/junie.shim.sh#L684-L700) exports both into the launched process. These are launcher-context signals; `JUNIE_DATA` can also be configured externally.                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| Codex        | Additional non-empty `CODEX_SANDBOX_NETWORK_DISABLED`                | [Official subprocess code](https://github.com/openai/codex/blob/6ae8b8aa7c608730d4315d59c5c081897ae02780/codex-rs/core/src/spawn.rs#L85-L88) injects `1` when network access is disabled by the sandbox policy. It is a conditional fallback, not a universal Codex marker.                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| Hermes Agent | Additional non-empty `HERMES_AGENT`                                  | [Official shell wrapper](https://github.com/NousResearch/hermes-agent/blob/e5eb6b36fe78eb012cefd1f5f436cd458411b8b3/tools/environments/base_session_env.py#L132-L159) exports the marker for terminal commands. Existing non-empty values are preserved, so the rule follows the registry's non-empty convention.                                                                                                                                                                                                                                                                                                                                                                                                           |

Grok Build and Grok Bot are separate entries. Their names alone are not evidence of a shared runtime or publisher.

## Static review of distributed desktop applications

The following findings come from static inspection of installed macOS distribution files, not a live end-to-end execution test. Public product pages establish product identity and capabilities; they do not promise these variables as stable public interfaces. Only independently written descriptions, variable names, fixed sentinel values, and artifact fingerprints are recorded here. No proprietary source, user paths, configuration, or real session identifiers are included.

### WorkBuddy 5.8.3

- Product: [WorkBuddy](https://www.codebuddy.cn/docs/workbuddy/From-Beginner-to-Expert-Guide/Product-Guide), bundle ID `com.tencent.workbuddy.mac`.
- `Contents/Resources/app.asar` SHA-256: `a7eff702411704d140d7d8d706fe9e711d9b13e304928481c9eba0af9c06f731`.
- `main/main-bootstrap.js`, `buildDaemonProcessEnv` (distribution line 77), constructs `WORKBUDDY_APPLICATION_NAME`, `WORKBUDDY_APP_NAME`, and the packaged-state flag. The daemon spawn merges this environment into its child environment.
- `main/sidecar-manager.js`, `buildSidecarProcessEnv` (line 16), preserves the parent environment. `app.asar.unpacked/cli/dist/codebuddy-lite-wb.mjs`, `buildChildProcessEnv` (line 1684), passes the resulting environment to ordinary shell and PTY children. The sandbox path carries it in its execution request; the native sandbox was not exercised.
- Both name rules require the exact value `WorkBuddy`. Config directories and packaged-state flags are not independent detection rules. Custom branding or multi-instance names may not match.

### Grok Bot 0.71.2

- Product: [Cursor's Grok Bot](https://cursor.com/docs/grok-bot/teams#architecture), bundle ID `com.anysphere.sand`. The documented architecture separates cloud agents and an optional local execution daemon.
- Distribution SHA-256: `055b087a9bacc3be4e5f80c468edf2fd031dd5b928ab2e7da7e01dd10de0e860`.
- `dist/local-exec-daemon/main.cjs` SHA-256: `af56c42ec34f893fcbb2486a7850f861d8a3a4be2e9031f9b07de3a163d09b60`.
- The executor setup (distribution line 756, function `iZe`) supplies `SAND_AGENT=1` and `CURSOR_AGENT=1`. Shell initialization (lines 602–611, functions `Jae`, `Vae`, `Wae`, `pI`) passes these into Bash/Zsh child environments.
- The local rule therefore matches only `SAND_AGENT=1` and precedes Cursor detection. `CURSOR_AGENT` is not an alternative Grok Bot marker. This static audit alone does not establish PowerShell or cloud-only coverage; the separate cloud-shell observation is documented below.

### QwenWork 1.2.5 distribution context

- Inspected distribution: QwenWorkCN 1.2.5, bundle ID `cn.qwenwork.desktop.mac`. The registered product is [QwenWork](https://qwenwork.cn/docs/product-introduction), with ID `qwenwork`. Internal Qoder-prefixed symbols do not establish a separate product identity.
- `Contents/Resources/app.asar` SHA-256: `d946457e5e3d7761f7203111775388d5131293a337bf13430e0c26b8993536fb`.
- `out/main/main.js` SHA-256: `59066b75806a1d7b3e798615302c957a9bca1efa8a7866c60e4d2b210c9c3f36`.
- The earlier static inspection located `composeQoderAgentSdkRuntimeEnv` (distribution line 654) and the `ShellExecutionService` / `QxcSeatbeltBackend.runBash` environment path (lines 2313–2316 and 1048). These internal symbol names are preserved as inspected. This context alone does not verify propagation of the product marker reported below.
- Country, chat, site, execution-mode, and endpoint configuration are not detection conditions. In particular, `QODERWORK_IS_CN` and `QODERWORK_SOURCE_CHAT_ID` do not identify this entry, alone or together.

Distribution line numbers refer to packaged JavaScript, not unpublished source repositories. Static propagation establishes reachable code paths, not successful execution under every shell setup or sandbox policy.

## User-provided runtime observation

### QwenWork product marker

On 2026-10-16, a user reported `QODER_WORK_INTEGRATION_PRODUCT=qwenworkcn` as the product identity marker for QwenWork. The rule accepts only that exact value, without case folding or whitespace trimming. The public product documentation establishes the QwenWork name, not a public contract for this internal environment variable. The report has not been independently reproduced as a dynamic product test.

The rule does not use `QODERWORK_IS_CN`, `QODERWORK_SOURCE_CHAT_ID`, `QODER_SITE`, `QODERWORK_EXECUTION_ENV`, `QWENWORK_BASE_URL`, or `QODERCN_SERVER_ENDPOINT` as alternatives. A country, chat identifier, local execution setting, or configured endpoint does not establish the product identity. No real user paths, addresses, or identifiers are retained.

### Grok Bot cloud shell

On 2026-10-16, a user confirmed that an ordinary shell in a Grok Bot cloud sandbox exposed a non-empty `CURSOR_AGENT`, `SAND_MANIFEST_V2=1`, and `SAND_SUPERVISOR_ENABLED=1`, without `SAND_AGENT`. The existing registry format cannot require these conditions together. This observation therefore adds no cloud detection rule. For the reported cloud-marker-only environment, existing clients continue to match Cursor CLI; first-match ordering and standard-declaration precedence are unchanged. Neither sandbox sentinel is added as an independent Grok Bot marker.

This is a user-reported shell observation, not an independently reproduced product test or a public vendor guarantee that these internal markers are exclusive to Grok Bot. No real sandbox identifiers, endpoints, paths, or environment snapshots are retained.

### Cue Linux desktop worker

On 2026-10-16, a user supplied an observation from a Cue Linux desktop-worker environment containing the exact marker `MANUS_LONG_DESKTOP_WORKER=1`. This was not independently reproduced by launching the product, and no public stable-interface guarantee was established. The rule is limited to that exact marker; other `MANUS_*` configuration or path variables do not identify this context. No desktop identifiers, endpoints, paths, or other runtime values from the observation are retained. The marker's `MANUS_*` namespace is not evidence that the observed product is Manus or Manus Studio.

### Muse execution context

On 2026-10-16, a user supplied observations attributed to Muse containing `JARVIS_IS_ASSIGNED=1` for an active session and a non-empty `JARVIS_TOOL_CALL_ID` during tool execution. Either execution marker can identify this observed context. `JARVIS_HATCHLING_ID`, `JARVIS_SESSION_ID`, `JARVIS_TIER`, `JARVIS_USER_TIMEZONE`, and `JARVIS_VM_COMPUTE_REGION` without an execution marker do not trigger the rule. Fixtures use synthetic values; no observed identifiers or context content are retained.

Meta's [official Muse architecture article](https://research.meta.ai/blog/security-and-safety-for-ai-agents-our-approach-with-muse) establishes the product identity and cloud VM execution model, but does not establish a public contract for these `JARVIS_*` variables. The environment observations were user-provided, not independently reproduced, and should not be generalized to every Muse interface or to the separate Muse Code product.

### Manus Studio add-on runtime

On 2026-10-16, a user reported seven `MANUS_ADDON_*` / `MANUS_GROUP_*` variable names and confirmed that they were observed in an ordinary Manus Studio shell. Actual values were withheld. The proposed detection rules accept a non-empty `MANUS_ADDON_RUNTIME_SPEC_PATH` or `MANUS_ADDON_RUNTIME_SPECS_REVISION` as an add-on runtime descriptor. This is a user-reported shell observation, not a verified public contract or a successful local static/dynamic audit of Manus Studio 2.0.7.

`MANUS_ADDON_PREVIEW_PUBLIC_ORIGIN`, `MANUS_ADDON_REGISTRY_ENABLED`, `MANUS_ADDON_RUNTIME_PUBLIC_ORIGIN`, `MANUS_ADDON_SERVER_BRANCH`, and `MANUS_GROUP_ENABLED` do not independently trigger detection. No enabled-flag value is inferred from a variable name. The Cue worker marker is a separate rule and does not identify Manus Studio. All fixture paths, revisions, origins, and flag values are synthetic, not retained runtime values.

## Validation scope

`src/agent-harnesses.spec.ts` checks the existing registry field contract, important precedence relationships, and non-empty/exact-value patterns with synthetic environments. These tests do not run the Python detector, read the machine's environment, or validate the vendor applications dynamically. Cases cover exact-value rejection, empty values, Grok Bot local-marker detection, unchanged Cursor fallback for shared sandbox markers, compatibility-marker precedence, and configuration-only non-matches.
