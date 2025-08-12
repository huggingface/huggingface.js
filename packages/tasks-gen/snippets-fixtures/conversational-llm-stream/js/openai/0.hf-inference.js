import { OpenAI } from "openai";

const client = new OpenAI({
	baseURL: "https://router.huggingface.co/v1",
	apiKey: process.env.HF_TOKEN,
});

const stream = await client.chat.completions.create({
    model: "meta-llama/Llama-3.1-8B-Instruct:hf-inference",
    messages: [
        {
            role: "user",
            content: "What is the capital of France?",
        },
    ],
    stream: true,
});

for await (const chunk of stream) {
    process.stdout.write(chunk.choices[0]?.delta?.content || "");
}