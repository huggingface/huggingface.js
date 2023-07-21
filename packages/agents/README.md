# 🤗 Hugging Face Agents.js

A way to call Hugging Face models and inference APIs from natural language, using an LLM.

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

Agents.js leverages LLMs hosted as Inference APIs on HF, so you need to create an account and generate an [access token](https://huggingface.co/settings/tokens).

```ts
import { HfAgent } from "@huggingface/agents";

const agent = new HfAgent("hf_...");

const code = await agent.generateCode("Draw a picture of a cat, wearing a top hat.")
console.log(code) // always good to check the generated code before running it
const outputs = await agent.evaluateCode(code);
console.log(outputs) 
```

### Choose your LLM

You can also use your own LLM, by calling one of the `LLMFrom*` functions.

#### From the hub
You can specify any valid model on the hub as long as they have an API.


```ts
import { HfAgent, LLMFromHub } from "@huggingface/agents";

const agent = new HfAgent(
  "hf_...",
  LLMFromHub("hf_...", "OpenAssistant/oasst-sft-4-pythia-12b-epoch-3.5")
);
```



#### From your own endpoints
You can also specify your own endpoint, as long as it implements the same API, for exemple using [text generation inference](https://github.com/huggingface/text-generation-inference) and [Inference Endpoints](https://huggingface.co/inference-endpoints).

```ts
import { HfAgent, LLMFromEndpoint } from "@huggingface/agents";

const agent = new HfAgent(
  "hf_...",
  LLMFromEndpoint("hf_...", "http://...")
);
```

#### Custom LLM
A LLM in this context is defined as any async function that takes a string input and returns a string. For example if you wanted to use the OpenAI API you could do so like this:

```ts
import { HfAgent } from "@huggingface/agents";
import { Configuration, OpenAIApi } from "openai";

const api = new OpenAIApi(new Configuration({ apiKey: "sk-..." }));

const llmOpenAI = async (prompt: string): Promise<string> => {
  return (
    (
      await api.createCompletion({
        model: "text-davinci-003",
        prompt: prompt,
        max_tokens: 1000,
      })
    ).data.choices[0].text ?? ""
  );
};

const agent = new HfAgent(
  "hf_...",
  llmOpenAI
);

// do anything you want with the agent here

```



### Tools 
By default, agents ship with 4 tools. (textToImage, textToSpeech, imageToText, speechToText)

But you can expand the list of tools easily by creating new tools and passing them at initialization.

```ts
import { HfAgent, defaultTools, LLMFromHub } from "@huggingface/agents";
import type { Tool } from "@huggingface/agents/src/types";

// define the tool
const uppercaseTool: Tool = {
    name: "uppercase",
    description: "uppercase the input string and returns it ",
    examples: [
        {
            prompt: "uppercase the string: hello world",
            code: `const output = uppercase("hello world")`,
            tools: ["uppercase"],
        },
    ],
    call: async (input) => {
        const data = await input;
        if (typeof data !== "string") {
            throw new Error("Input must be a string");
        }
        return data.toUpperCase();
    },
};

// pass it in the agent
const agent = new HfAgent(process.env.HF_ACCESS_TOKEN, 
                LLMFromHub("hf_...", "OpenAssistant/oasst-sft-4-pythia-12b-epoch-3.5"),
                [uppercaseTool, ...defaultTools]);
```

## Dependencies

- `@huggingface/inference` : Required to call the inference endpoints themselves.
