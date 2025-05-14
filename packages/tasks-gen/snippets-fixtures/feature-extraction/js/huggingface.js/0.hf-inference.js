import { InferenceClient } from "@huggingface/inference";

const client = new InferenceClient("api_token");

const output = await client.featureExtraction({
	model: "intfloat/multilingual-e5-large-instruct",
	inputs: "Today is a sunny day and I will get some ice cream.",
	provider: "hf-inference",
});

console.log(output);