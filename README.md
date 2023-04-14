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

# Hugging Face JS libraries

This is a collection of JS libraries to interact with the Hugging Face API, with TS types included.

- [@huggingface/hub](packages/hub/README.md): Interact with huggingface.co to create or delete repos and commit / download files
- [@huggingface/inference](packages/inference/README.md): Use the Inference API to make calls to 100,000+ Machine Learning models, or to your own [inference endpoints](https://hf.co/docs/inference-endpoints/)!

With more to come, like `@huggingface/endpoints` to manage your HF Endpoints!

We use modern features to avoid polyfills and dependencies, so the libraries will only work on modern browsers / Node.js >= 18 / Bun / Deno. 

The libraries are still very young, please help us by opening issues!

## Installation

### From NPM

To install via NPM, you can download the libraries as needed:

```bash
npm install @huggingface/hub
npm install @huggingface/inference
```

Then import the libraries in your code:

```ts
import { createRepo, commit, deleteRepo, listFiles } from "@huggingface/hub";
import { HfInference } from "@huggingface/inference";
import type { RepoId, Credentials } from "@huggingface/hub";
```

### From CDN or Static hosting

You can run our packages with vanilla JS, without any bundler, by using a CDN or static hosting. Using [ES modules](https://hacks.mozilla.org/2018/03/es-modules-a-cartoon-deep-dive/), i.e. `<script type="module">`, you can import the libraries in your code:

```html

<script type="module">
    import { HfInference } from 'https://cdn.jsdelivr.net/npm/@huggingface/inference@1.8.0/+esm';
    import { createRepo, commit, deleteRepo, listFiles } from "https://cdn.jsdelivr.net/npm/@huggingface/hub@0.5.0/+esm";
</script>
```

## Usage example

```ts
import { createRepo, uploadFile, deleteFiles } from "@huggingface/hub";
import { HfInference } from "@huggingface/inference";

// use an access token from your free account
const HF_ACCESS_TOKEN = "hf_...";

await createRepo({
  repo: "my-user/nlp-model", // or {type: "model", name: "my-user/nlp-test"},
  credentials: {accessToken: HF_ACCESS_TOKEN}
});

await uploadFile({
  repo: "my-user/nlp-model",
  credentials: {accessToken: HF_ACCESS_TOKEN},
  // Can work with native File in browsers
  file: {
    path: "pytorch_model.bin",
    content: new Blob(...) 
  }
});

await deleteFiles({
  repo: {type: "space", name: "my-user/my-space"}, // or "spaces/my-user/my-space"
  credentials: {accessToken: HF_ACCESS_TOKEN},
  paths: ["README.md", ".gitattributes"]
});

const inference = new HfInference(HF_ACCESS_TOKEN);

await inference.translation({
  model: 't5-base',
  inputs: 'My name is Wolfgang and I live in Berlin'
})

await inference.textToImage({
  inputs: 'award winning high resolution photo of a giant tortoise/((ladybird)) hybrid, [trending on artstation]',
  model: 'stabilityai/stable-diffusion-2',
  parameters: {
    negative_prompt: 'blurry',
  }
})

await inference.imageToText({
  data: await (await fetch('https://picsum.photos/300/300')).blob(),
  model: 'nlpconnect/vit-gpt2-image-captioning',  
})

// Using your own inference endpoint: https://hf.co/docs/inference-endpoints/
const gpt2 = hf.endpoint('https://xyz.eu-west-1.aws.endpoints.huggingface.cloud/gpt2');
const { generated_text } = await gpt2.textGeneration({inputs: 'The answer to the universe is'});
```

There are more features of course, check each library's README!

## Formatting & testing

```console
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
