# 🤗 HuggingFace API libraries

This is a collection of JS libraries to interact with Hugging Face, with TS types included.

- [@huggingface/hub](packages/hub/README.md): Interact with huggingface.co to create or delete repos and commit / download files
- [@huggingface/inference](packages/inference/README.md): Use the Inference API to make calls to Machine Learning models!

With more to come, like `@huggingface/endpoints` to manage your HF Endpoints!

We use modern features to avoid polyfills and dependencies, so the libraries will only work on modern browsers / Node.js >= 18 / Bun / Deno. 

The libraries is still very young, please help us by opening issues!

## Usage example

```ts
import { createRepo, commit } from "@huggingface/hub";
import { HfInference } from "@huggingface/inferenfe";

const HF_ACCESS_TOKEN = "hf_...";

await createRepo({
  repo: {type: "model", name: "my-user/nlp-test"},
  credentials: {accessToken: HF_ACCESS_TOKEN}
});

await commit({
  repo: {type: "model", name: "my-user/nlp-test"},
  credentials: {accessToken: HF_ACCESS_TOKEN},
  title: "Add model file",
  operations: [{
    operation: "addOrUpdate",
    path: "pytorch_model.bin",
    content: new Blob(...) // Can work with native File in browsers
  }]
});

const inference = new HfInference(HF_ACCESS_TOKEN);

await inference.fillMask({
  model: "my-user/nlp-test",
  inputs: "[MASK] world!"
});
```
