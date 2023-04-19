The main features for this release are:

- Support for Inference endpoints! credits to @vvmnnnkv 
- Custom requests via `request` and `streamingRequest`
- Possibility to import the methods directly without the need to instantiate an `HfInference` class: great for tree-shaking
- New NLP task: `featureExtraction` (the existing `featureExtraction` task was renamed to `sentenceSimilarity`, oops!), credits @radames 


The other changes for recent versions are detailed at the end (including `textGenerationStream` for streaming text generation, ...)

## Support for Inference Endpoints

[Inference endpoints](https://huggingface.co/docs/inference-endpoints/index) are the next step for using Inference API for a specific model in production.

The different tiers for inference are:

- Inference API (no token): restrictive rate limits
- Inference API - free account: usable rate limits
- Inference API - PRO account: better rate limits
- Inference Endpoints: Unlimited API calls, possibility to deploy on the cloud provider / VPC / infra of your choice, scaling

Here's how you can call an inference endpoint:

```ts
const inference = new HfInference("hf_...");

const gpt2 = inference.endpoint('https://xyz.eu-west-1.aws.endpoints.huggingface.cloud/gpt2');
const { generated_text } = await gpt2.textGeneration({inputs: 'The answer to the universe is'});
```

You can even use the free inference API backend with this syntax:

```ts
const endpoint = inference.endpoint("https://api-inference.huggingface.co/models/google/flan-t5-xxl");
const { generated_text } = await endpoint.textGeneration({
  inputs: "one plus two equals",
});
```

It's easy to switch between Inference API & Inference Endpoints. So easy, that you can even do this:

```ts
await inference.textGeneration({
  model: 'https://xyz.eu-west-1.aws.endpoints.huggingface.cloud/gpt2',
  inputs: 'The answer to the universe is'
});
```

## Custom requests

`@huggingface/inference` supports tasks from https://huggingface.co/tasks, and is typed accordingly. But what if your model has additional inputs, or even custom inputs or outputs?

You can now use `.request` and `.streamingRequest`!

```ts
const output = await inference.request({
  inputs: "blablabla",
  parameters: {
    custom_parameter_1: ...,
    ...
  }
});
```

For streaming responses, use `streamingRequest` rather than `request`.

All existing tasks can use `request` or `streamingRequest` instead :exploding_head: 

```ts
const {generated_text} = await inference.textGeneration({model: "gpt2", inputs: "The answer to the universe is"});
// small output change for .textGeneration to .request: the raw response is actually an array
const [{generated_text}] = await inference.request({model: "gpt2", inputs: "The answer to the universe is"});

for await (const output of inference.textGenerationStream({
  model: "google/flan-t5-xxl", 
  inputs: "Repeat 'one two three four'"
})) {}
// is equivalent to
for await (const output of inference.streamingRequest({
  model: "google/flan-t5-xxl", 
  inputs: "Repeat 'one two three four'"
})) {}
```

Of course, `request` and `streamingRequest` can also be used with Inference Endpoints! Actually, if you make your own custom models and inputs / outputs for your business use case, it'll probably be what you use.

## Individual imports & tree-shakability

You don't like the current API, you don't like classes, and want the strict minimum in your bundle? No need to say more, I know which frontend framework (or should I say library ;)) you use.

Don't worry, you can import individual functions - this release of `@hugginface/inference` is all about choice and flexibility:

```ts
import { textGeneration } from "@huggingface/inference";

await textGeneration({
  accessToken: "hf_...", // new param
  model: "gpt2", // or your own inference endpoint
  inputs: "The best, most efficient and purest frontend framework is: "
});
```

## Breaking changes

- `questionAnswer` and `tableQuestionAnswer` have been renamed to `questionAnswering` and `tableQuestionAnswering`
- The existing `featureExtraction` has been renamed to `sentenceSimilarity` and a new `featureExtraction` was created :bow: 

## Other changes from recent releases:

- `textGenerationStream` to generate streaming content by returning an `AsyncIterable`. Yay for `for await`! Credits to @vvmnnnkv. [Demo](https://huggingface.co/spaces/huggingfacejs/streaming-text-generation)
- `imageToText` to caption images among other things. Credits to @vvmnnnkv. [Demo](https://huggingface.co/spaces/huggingfacejs/image-to-text)
- Validation of outputs: Use `request` or `streamingRequest` to skip this validation. Credits to @mishig25 
