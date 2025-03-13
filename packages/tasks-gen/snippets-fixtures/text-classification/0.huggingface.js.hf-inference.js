import { InferenceClient } from "@huggingface/inference";

const client = new InferenceClient("api_token");

const output = await client.textClassification({
	model: "distilbert/distilbert-base-uncased-finetuned-sst-2-english",
	inputs: "I like you. I love you",
	provider: "hf-inference",
});

console.log(output);
