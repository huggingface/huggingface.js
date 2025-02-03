import { HfInference } from "@huggingface/inference";

const client = new HfInference("api_token");

let out = "";

const stream = client.chatCompletionStream({
	model: "meta-llama/Llama-3.1-8B-Instruct",
	messages: [
		{
			role: "user",
			content: "What is the capital of France?"
		}
	],
	provider: "hf-inference",
	max_tokens: 500
});

for await (const chunk of stream) {
	if (chunk.choices && chunk.choices.length > 0) {
		const newContent = chunk.choices[0].delta.content;
		out += newContent;
		console.log(newContent);
	}  
}