import OpenAI from "openai";

const client = new OpenAI({ baseURL: "http://localhost:3000/v1", apiKey: process.env.HF_TOKEN });

const response = await client.responses.create({
	model: "Qwen/Qwen2.5-VL-7B-Instruct",
	instructions: "You are a helpful assistant.",
	input: "Tell me a three sentence bedtime story about a unicorn.",
});

console.log(response);
console.log(response.output_text);
