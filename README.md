<p align="center">
  <br/>
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://huggingface.co/datasets/huggingface/documentation-images/raw/main/huggingfacejs-dark.svg">
    <source media="(prefers-color-scheme: light)" srcset="https://huggingface.co/datasets/huggingface/documentation-images/raw/main/huggingfacejs-light.svg">
    <img alt="huggingface javascript library logo" src="https://huggingface.co/datasets/huggingface/documentation-images/raw/main/huggingfacejs-light.svg" width="376" height="59" style="max-width: 100%;">
  </picture>
  <br/>
  <br/>
</p>

```ts
// Programatically interact with the Hub

await createRepo({
  repo: {type: "model", name: "my-user/nlp-model"},
  credentials: {accessToken: HF_TOKEN}
});

await uploadFile({
  repo: "my-user/nlp-model",
  credentials: {accessToken: HF_TOKEN},
  // Can work with native File in browsers
  file: {
    path: "pytorch_model.bin",
    content: new Blob(...) 
  }
});

// Use hosted inference

await inference.translation({
  model: 't5-base',
  inputs: 'My name is Wolfgang and I live in Berlin'
})

await inference.textToImage({
  model: 'stabilityai/stable-diffusion-2',
  inputs: 'award winning high resolution photo of a giant tortoise/((ladybird)) hybrid, [trending on artstation]',
  parameters: {
    negative_prompt: 'blurry',
  }
})

// and much more…
```

# Hugging Face JS libraries

This is a collection of JS libraries to interact with the Hugging Face API, with TS types included.

- [@huggingface/inference](packages/inference/README.md): Use Inference Endpoints (dedicated) and Inference API (serverless) to make calls to 100,000+ Machine Learning models
- [@huggingface/hub](packages/hub/README.md): Interact with huggingface.co to create or delete repos and commit / download files
- [@huggingface/agents](packages/agents/README.md): Interact with HF models through a natural language interface
- [@huggingface/gguf](packages/gguf/README.md): A GGUF parser that works on remotely hosted files.
- [@huggingface/tasks](packages/tasks/README.md): The definition files and source-of-truth for the Hub's main primitives like pipeline tasks, model libraries, etc.
- [@huggingface/space-header](packages/space-header/README.md): Use the Space `mini_header` outside Hugging Face


We use modern features to avoid polyfills and dependencies, so the libraries will only work on modern browsers / Node.js >= 18 / Bun / Deno.

The libraries are still very young, please help us by opening issues!

## Installation

### From NPM

To install via NPM, you can download the libraries as needed:

```bash
npm install @huggingface/inference
npm install @huggingface/hub
npm install @huggingface/agents
```

Then import the libraries in your code:

```ts
import { HfInference } from "@huggingface/inference";
import { HfAgent } from "@huggingface/agents";
import { createRepo, commit, deleteRepo, listFiles } from "@huggingface/hub";
import type { RepoId, Credentials } from "@huggingface/hub";
```

### From CDN or Static hosting

You can run our packages with vanilla JS, without any bundler, by using a CDN or static hosting. Using [ES modules](https://hacks.mozilla.org/2018/03/es-modules-a-cartoon-deep-dive/), i.e. `<script type="module">`, you can import the libraries in your code:

```html
<script type="module">
    import { HfInference } from 'https://cdn.jsdelivr.net/npm/@huggingface/inference@2.7.0/+esm';
    import { createRepo, commit, deleteRepo, listFiles } from "https://cdn.jsdelivr.net/npm/@huggingface/hub@0.15.1/+esm";
</script>
```

### Deno

```ts
// esm.sh
import { HfInference } from "https://esm.sh/@huggingface/inference"
import { HfAgent } from "https://esm.sh/@huggingface/agents";

import { createRepo, commit, deleteRepo, listFiles } from "https://esm.sh/@huggingface/hub"
// or npm:
import { HfInference } from "npm:@huggingface/inference"
import { HfAgent } from "npm:@huggingface/agents";

import { createRepo, commit, deleteRepo, listFiles } from "npm:@huggingface/hub"
```

## Usage examples

Get your HF access token in your [account settings](https://huggingface.co/settings/tokens).

### @huggingface/inference examples

```ts
import { HfInference } from "@huggingface/inference";

const HF_TOKEN = "hf_...";

const inference = new HfInference(HF_TOKEN);

// Chat completion API
const out = await inference.chatCompletion({
  model: "mistralai/Mistral-7B-Instruct-v0.2",
  messages: [{ role: "user", content: "Complete the this sentence with words one plus one is equal " }],
  max_tokens: 100
});
console.log(out.choices[0].message);

// Streaming chat completion API
for await (const chunk of inference.chatCompletionStream({
  model: "mistralai/Mistral-7B-Instruct-v0.2",
  messages: [{ role: "user", content: "Complete the this sentence with words one plus one is equal " }],
  max_tokens: 100
})) {
  console.log(chunk.choices[0].delta.content);
}

// You can also omit "model" to use the recommended model for the task
await inference.translation({
  model: 't5-base',
  inputs: 'My name is Wolfgang and I live in Amsterdam'
})

await inference.textToImage({
  model: 'stabilityai/stable-diffusion-2',
  inputs: 'award winning high resolution photo of a giant tortoise/((ladybird)) hybrid, [trending on artstation]',
  parameters: {
    negative_prompt: 'blurry',
  }
})

await inference.imageToText({
  data: await (await fetch('https://picsum.photos/300/300')).blob(),
  model: 'nlpconnect/vit-gpt2-image-captioning',  
})

// Using your own dedicated inference endpoint: https://hf.co/docs/inference-endpoints/
const gpt2 = inference.endpoint('https://xyz.eu-west-1.aws.endpoints.huggingface.cloud/gpt2');
const { generated_text } = await gpt2.textGeneration({inputs: 'The answer to the universe is'});

//Chat Completion
const mistal = inference.endpoint(
 "https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.2"
);
const out = await mistal.chatCompletion({
 model: "mistralai/Mistral-7B-Instruct-v0.2",
 messages: [{ role: "user", content: "Complete the this sentence with words one plus one is equal " }],
 max_tokens: 100,
});
console.log(out.choices[0].message);
```

### @huggingface/hub examples

```ts
import { createRepo, uploadFile, deleteFiles } from "@huggingface/hub";

const HF_TOKEN = "hf_...";

await createRepo({
  repo: "my-user/nlp-model", // or {type: "model", name: "my-user/nlp-test"},
  credentials: {accessToken: HF_TOKEN}
});

await uploadFile({
  repo: "my-user/nlp-model",
  credentials: {accessToken: HF_TOKEN},
  // Can work with native File in browsers
  file: {
    path: "pytorch_model.bin",
    content: new Blob(...) 
  }
});

await deleteFiles({
  repo: {type: "space", name: "my-user/my-space"}, // or "spaces/my-user/my-space"
  credentials: {accessToken: HF_TOKEN},
  paths: ["README.md", ".gitattributes"]
});
```

### @huggingface/agents example

```ts
import {HfAgent, LLMFromHub, defaultTools} from '@huggingface/agents';

const HF_TOKEN = "hf_...";

const agent = new HfAgent(
  HF_TOKEN,
  LLMFromHub(HF_TOKEN),
  [...defaultTools]
);


// you can generate the code, inspect it and then run it
const code = await agent.generateCode("Draw a picture of a cat wearing a top hat. Then caption the picture and read it out loud.");
console.log(code);
const messages = await agent.evaluateCode(code)
console.log(messages); // contains the data

// or you can run the code directly, however you can't check that the code is safe to execute this way, use at your own risk.
const messages = await agent.run("Draw a picture of a cat wearing a top hat. Then caption the picture and read it out loud.")
console.log(messages); 
```

There are more features of course, check each library's README!

## Formatting & testing

```console
sudo corepack enable
pnpm install

pnpm -r format:check
pnpm -r lint:check
pnpm -r test
```

## Building

```
pnpm -r build
```

This will generate ESM and CJS javascript files in `packages/*/dist`, eg `packages/inference/dist/index.mjs`.
