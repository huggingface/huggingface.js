import { OpenAI } from "openai";

const client = new OpenAI({
	baseURL: "https://router.huggingface.co/together/v1",
	apiKey: process.env.HF_TOKEN,
});

const chatCompletion = await client.chat.completions.create({
	model: "<together alias for meta-llama/Llama-3.1-8B-Instruct>",
    messages: [
        {
            role: "user",
            content: "What is the capital of France?",
        },
    ],
});

console.log(chatCompletion.choices[0].message);