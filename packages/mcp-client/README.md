# @huggingface/mcp-client

Client for the Model Context Protocol (MCP).

This package provides a client implementation for interacting with MCP servers, built on top of our InferenceClient, `@huggingface/inference`.

It includes an example CLI smol Agent that can leverage MCP tools.

## Installation

This package is part of the Hugging Face JS monorepo. To install dependencies for all packages, run from the root of the repository:

```bash
pnpm install
```

## Usage (CLI Agent)

The package includes a command-line interface (CLI) agent that demonstrates how to use the MCP client.

### Prerequisites

*   **Hugging Face API Token:** You need a Hugging Face API token with appropriate permissions. Set it as an environment variable:
    ```bash
    export HF_TOKEN="hf_..."
    ```

### Running the Agent

Navigate to the package directory and run the agent script:

```bash
cd packages/mcp-client
pnpm agent
```

Alternatively, run from the root of the monorepo:

```bash
pnpm --filter @huggingface/mcp-client agent
```

The agent will load available MCP tools (by default, connecting to a filesystem server for your Desktop and a Playwright server) and prompt you for input (`>`).

### Configuration (Environment Variables)

*   `HF_TOKEN` (Required): Your Hugging Face API token.
*   `MODEL_ID` (Optional): The model ID to use for the agent's inference. Defaults to `Qwen/Qwen2.5-72B-Instruct`.
*   `PROVIDER` (Optional): The inference provider. Defaults to `together`. See `@huggingface/inference` for available providers.
*   `EXPERIMENTAL_HF_MCP_SERVER` (Optional): Set to `true` to enable connection to an experimental Hugging Face MCP server (requires separate setup).

Example with custom model:

```bash
export HF_TOKEN="hf_..."
export MODEL_ID="mistralai/Mixtral-8x7B-Instruct-v0.1"
pnpm agent
```

## Development

Common development tasks can be run using pnpm scripts:

*   `pnpm build`: Build the package.
*   `pnpm lint`: Lint and fix code style.
*   `pnpm format`: Format code using Prettier.
*   `pnpm test`: Run tests using Vitest.
*   `pnpm check`: Type-check the code using TypeScript.

## License

MIT
