import { OpenAI } from "openai";

const client = new OpenAI({
	baseURL: "http://localhost:8080/v1",
	apiKey: process.env.API_TOKEN,
});

const chatCompletion = await client.chat.completions.create({
	model: "meta-llama/Llama-3.1-8B-Instruct",
    messages: [
        {
            role: "user",
            content: "What is the capital of France?",
        },
    ],
});

console.log(chatCompletion.choices[0].message);