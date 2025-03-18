import { InferenceClient } from "@huggingface/inference";

const client = new InferenceClient("api_token");

const output = await client.tokenClassification({
	model: "FacebookAI/xlm-roberta-large-finetuned-conll03-english",
	inputs: "My name is Sarah Jessica Parker but you can call me Jessica",
	provider: "hf-inference",
});

console.log(output);