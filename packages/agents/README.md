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

For using the agents feature, you need to create an account and generate an [access token](https://huggingface.co/settings/tokens).

```ts
import { HfAgent } from "@huggingface/agents";
import { HfInference } from "@huggingface/inference";

const agent = new HfAgent("hf_...");

const code = await agent.generateCode("Draw a picture of a cat, wearing a top hat.")
console.log(code) // always good to check the generated code before running it
const outputs = await agent.evaluateCode(code);
console.log(outputs) 
```

### Choose your LLM

You can also use your own LLM, either from the hub or using your own endpoints.

#### From the hub
You can specify any valid model on the hub as long as they have an API.


```ts
import { HfAgent } from "@huggingface/agents";

const agent = new HfAgent("hf_...", {
     model: "OpenAssistant/oasst-sft-4-pythia-12b-epoch-3.5" 
});
```



#### From your own endpoints
You can also specify your own endpoint, as long as it implements the same API, for exemple using [text generation inference](https://github.com/huggingface/text-generation-inference).

```ts
import { HfAgent } from "@huggingface/agents";

const agent = new HfAgent("hf_...", {
    endpoint: "https://api-inference.huggingface.co/models/OpenAssistant/oasst-sft-4-pythia-12b-epoch-3.5",
});
```


### Tools 
By default, agents ship with 4 tools:
* `textToImage`
* `textToSpeech`
* `imageToText`
* `speechToText`

But you can expand the list of tools easily by creating new tools and passing them at initialization.

```ts
import { HfAgent, defaultTools } from "@huggingface/agents";

// define the tool
const uppercaseTool = {
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
                {model: "OpenAssistant/oasst-sft-4-pythia-12b-epoch-3.5" },
                [uppercaseTool, ...defaultTools]);
```

## Dependencies

- `@huggingface/inference` : Required to call the inference endpoints themselves.
