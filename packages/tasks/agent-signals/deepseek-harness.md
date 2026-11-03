# DeepSeek Harness shell marker

Investigated while maintaining [Detect Agent](https://github.com/ai-shifu/detect-agent), a community specification with shared synthetic cases. [Pinned source record](https://github.com/ai-shifu/detect-agent/blob/c06e732d17d02f74fd9b452f20c4fa17a9f95a03/detect-agent.md#published-marker-injection-references).

The [producer's published shell environment](https://github.com/deepseek-ai/deepseek-harness/blob/ce7073d51254c26cd63b22a60835b8f948deb447/packages/shell/shell-env/README.md) documents DSH_SHELL for model shell calls. Match the non-empty sentinel; DSH_HOME is configuration and session metadata alone is insufficient. Prefer an inner coding agent's own marker over this inherited host marker.

Reviewed scope: published producer source and documentation at ce7073d51254c26cd63b22a60835b8f948deb447, supplemented by the scoped macOS distribution observation recorded in Detect Agent. This contribution runs synthetic tests, not a new live vendor session. It does not establish every build, platform or interface, nor authenticate who initiated a command.

This implementation follows this repository's API and matching conventions. There is no runtime dependency on Detect Agent and no process-tree probe or marker-value output added.
