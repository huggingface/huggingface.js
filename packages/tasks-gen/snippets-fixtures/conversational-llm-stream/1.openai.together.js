import { OpenAI } from "openai";

const client = new OpenAI({
	baseURL: "https://router.huggingface.co/together",
	apiKey: "api_token"
});

let out = "";

const stream = await client.chat.completions.create({
	model: "<together alias for meta-llama/Llama-3.1-8B-Instruct>",
	messages: [
		{
			role: "user",
			content: "What is the capital of France?"
		}
	],
	max_tokens: 500,
	stream: true,
});

for await (const chunk of stream) {
	if (chunk.choices && chunk.choices.length > 0) {
		const newContent = chunk.choices[0].delta.content;
		out += newContent;
		console.log(newContent);
	}  
}