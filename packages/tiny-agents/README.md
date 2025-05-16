# @huggingface/tiny-agents

A lightweight, composable agent framework for AI applications built on Hugging Face's JS stack.

## Installation

```bash
npm install @huggingface/tiny-agents
# or
yarn add @huggingface/tiny-agents
# or
pnpm add @huggingface/tiny-agents
```

## CLI Usage

```bash
npx @huggingface/tiny-agents [command] "agent/id"

```

```
Usage:
  tiny-agents [flags]
  tiny-agents run   "agent/id"
  tiny-agents serve "agent/id"

Available Commands:
  run         Run the Agent in command-line
  serve       Run the Agent as an OpenAI-compatible HTTP server
```


## Programmatic Usage

```typescript
import { Agent } from '@huggingface/tiny-agents';

const HF_TOKEN = "hf_...";

// Create an Agent
const agent = new Agent({
  provider: "auto",
  model: "Qwen/Qwen2.5-72B-Instruct",
  apiKey: HF_TOKEN,
  servers: [
    {
      // Playwright MCP
      command: "npx",
      args: ["@playwright/mcp@latest"],
    },
  ],
});

await agent.loadTools();

// Use the Agent
for await (const chunk of agent.run("What are the top 5 trending models on Hugging Face?")) {
    if ("choices" in chunk) {
        const delta = chunk.choices[0]?.delta;
        if (delta.content) {
            console.log(delta.content);
        }
    }
}
```


## License

MIT
