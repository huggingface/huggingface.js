# 🤗 Hugging Face Agents

A way to call Hugging Face inference APIs using an LLM.

## Install

```console
pnpm add @huggingface/agents

npm add @huggingface/agents

yarn add @huggingface/agents
```

### Deno

```ts
// esm.sh
import { HfAgent } from "https://esm.sh/@huggingface/agent"
// or npm:
import { HfAgent } from "npm:@huggingface/agent"
```

Check out the [full documentation](https://huggingface.co/docs/huggingface.js/agents/README).

## Usage

For using the agents feature, you need to create an account and generate an [access token](https://huggingface.co/settings/tokens).

```ts
import { HfAgent } from "@huggingface/agents";
import { HfInference } from "@huggingface/inference 

const llm = new HfInference
const agent = new HfAgent({ accessToken: "hf_..." });

const code = await agent.generateCode("Draw a picture of a cat, wearing a top hat.")
console.log(code) // always good to check the generated code before running it
const outputs = await agent.evaluateCode(code);
console.log(outputs)
```

## Dependencies

- `@huggingface/inference` : Required to call the inference endpoints themselves.
