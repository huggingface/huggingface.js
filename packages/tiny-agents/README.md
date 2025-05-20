# @huggingface/tiny-agents

![meme](https://huggingface.co/datasets/huggingface/documentation-images/resolve/main/blog/tiny-agents/legos.png)

A squad of lightweight composable AI applications built on Hugging Face's Inference Client and MCP stack.

## Installation

```bash
npm install @huggingface/tiny-agents
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

## Define your own agent

The simplest way to create your own agent is to create a folder containing an `agent.json` file:

```bash
mkdir my-agent
touch my-agent/agent.json
```

```json
{
	"model": "Qwen/Qwen2.5-72B-Instruct",
	"provider": "nebius",
	"servers": [
		{
			"type": "stdio",
			"config": {
				"command": "npx",
				"args": ["@playwright/mcp@latest"]
			}
		}
	]
}
```

Or using a local or remote endpoint URL:

```json
{
	"model": "Qwen/Qwen3-32B",
	"endpointUrl": "http://localhost:1234/v1",
	"servers": [
		{
			"type": "stdio",
			"config": {
				"command": "npx",
				"args": ["@playwright/mcp@latest"]
			}
		}
	]
}

```

Where `servers` is a list of MCP servers (we support Stdio, SSE, and HTTP servers).

Optionally, you can add a `PROMPT.md` file to override the default Agent prompt.

Then just point tiny-agents to your local folder:

```bash
npx @huggingface/tiny-agents run ./my-agent
```

Voilà! 🔥

> [!NOTE]
> Note: you can open a PR in the huggingface.js repo to share your agent with the community, just upload it inside the `src/agents/` directory.

### Advanced: Programmatic Usage

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
