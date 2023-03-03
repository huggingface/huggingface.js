<p align="center">
  <br/>
  <picture> 
  <!-- <source media="(prefers-color-scheme: dark)" srcset="https://huggingface.co/datasets/huggingface/documentation-images/raw/main/huggingfacejs-dark.svg">
    <source media="(prefers-color-scheme: light)" srcset="https://huggingface.co/datasets/huggingface/documentation-images/raw/main/huggingfacejs-light.svg"> -->
    <img alt="huggingface javascript library logo" src="https://huggingface.co/datasets/huggingface/documentation-images/raw/main/huggingfacejs-light.svg" width="376" height="59" style="max-width: 100%;">
  </picture>
  <br/>
  <br/>
</p>

# Hugging Face JS libraries

This is a collection of JS libraries to interact with the Hugging Face API, with TS types included.

- [@huggingface/hub](hub/README): Interact with huggingface.co to create or delete repos and commit / download files
- [@huggingface/inference](inference/README): Use the Inference API to make calls to Machine Learning models!

With more to come, like `@huggingface/endpoints` to manage your HF Endpoints!

We use modern features to avoid polyfills and dependencies, so the libraries will only work on modern browsers / Node.js >= 18 / Bun / Deno. 

The libraries is still very young, please help us by opening issues!

## Usage example

```ts
import { createRepo, commit } from "@huggingface/hub";
import { HfInference } from "@huggingface/inference";

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

await hf.translation({
  model: 't5-base',
  inputs: 'My name is Wolfgang and I live in Berlin'
})

await hf.textToImage({
  inputs: 'award winning high resolution photo of a giant tortoise/((ladybird)) hybrid, [trending on artstation]',
  negative_prompt: 'blurry',
  model: 'stabilityai/stable-diffusion-2',
})
```

There are more features of course, check each library's README!
