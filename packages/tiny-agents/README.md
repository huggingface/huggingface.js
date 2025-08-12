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

You can load agents directly from the Hugging Face Hub [tiny-agents](https://huggingface.co/datasets/tiny-agents/tiny-agents) Dataset, or specify a path to your own local agent configuration.

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
			"command": "npx",
			"args": ["@playwright/mcp@latest"]
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
			"command": "npx",
			"args": ["@playwright/mcp@latest"]
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


## Tiny Agents collection

Browse our curated collection of Tiny Agents at https://huggingface.co/datasets/tiny-agents/tiny-agents. Each agent is stored in its own subdirectory, following the structure outlined above. Running an agent from the Hub is as simple as using its `agent_id`. For example, to run the [`julien-c/flux-schnell-generator`](https://huggingface.co/datasets/tiny-agents/tiny-agents/tree/main/julien-c/flux-schnell-generator) agent:

```bash
npx @huggingface/tiny-agents run "julien-c/flux-schnell-generator"
```

> [!NOTE]
> Want to share your own agent with the community? Submit a PR to the [Tiny Agents](https://huggingface.co/datasets/tiny-agents/tiny-agents/discussions) repository on the Hub. Your submission must include an `agent.json` file, and you can optionally add a `PROMPT.md` file. To help others understand your agent's capabilities, consider including an `EXAMPLES.md` file with sample prompts and use cases.

## Advanced: Programmatic Usage

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
