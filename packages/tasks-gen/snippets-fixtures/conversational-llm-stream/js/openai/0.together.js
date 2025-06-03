import { OpenAI } from "openai";

const client = new OpenAI({
	baseURL: "https://api.together.xyz/v1",
	apiKey: process.env.TOGETHER_API_TOKEN,
});

const stream = await client.chat.completions.create({
    model: "<together alias for meta-llama/Llama-3.1-8B-Instruct>",
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