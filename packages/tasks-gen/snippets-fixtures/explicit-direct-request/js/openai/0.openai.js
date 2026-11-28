import { OpenAI } from "openai";

const client = new OpenAI({
	baseURL: "https://api.openai.com/v1",
	apiKey: process.env.OPENAI_API_KEY,
});

const chatCompletion = await client.chat.completions.create({
	model: "<openai alias for meta-llama/Llama-3.1-8B-Instruct>",
    messages: [
        {
            role: "user",
            content: "What is the capital of France?",
        },
    ],
});

console.log(chatCompletion.choices[0].message);