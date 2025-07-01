import OpenAI from "openai";

const client = new OpenAI({ baseURL: "http://localhost:3000/v1", apiKey: process.env.HF_TOKEN });

const response = await client.responses.create({
	model: "Qwen/Qwen2.5-VL-7B-Instruct",
	input: [
		{
			role: "developer",
			content: "Talk like a pirate.",
		},
		{
			role: "user",
			content: "Are semicolons optional in JavaScript?",
		},
	],
});

console.log(response);
console.log(response.output_text);
