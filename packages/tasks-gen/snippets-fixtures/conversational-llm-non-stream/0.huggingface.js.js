import { HfInference } from "@huggingface/inference";

const client = new HfInference("api_token");

const chatCompletion = await client.chatCompletion({
	model: "meta-llama/Llama-3.1-8B-Instruct",
	messages: [
		{
			role: "user",
			content: "What is the capital of France?"
		}
	],
	max_tokens: 500
});

console.log(chatCompletion.choices[0].message);