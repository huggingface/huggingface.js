import { InferenceClient } from "@huggingface/inference";

const client = new InferenceClient(process.env.HF_TOKEN);

const output = await client.featureExtraction({
	model: "intfloat/multilingual-e5-large-instruct",
	inputs: "Today is a sunny day and I will get some ice cream.",
	provider: "hf-inference",
});

console.log(output);