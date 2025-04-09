import { OpenAI } from "openai";

const client = new OpenAI({
	baseURL: "https://router.huggingface.co/hf-inference/models/meta-llama/Llama-3.1-8B-Instruct/v1",
	apiKey: "api_token",
});

let out = "";

const stream = await client.chat.completions.create({
    model: "meta-llama/Llama-3.1-8B-Instruct",
    messages: [
        {
            role: "user",
            content: "What is the capital of France?",
        },
    ],
    max_tokens: 500,
    stream: true,
});

for await (const chunk of stream) {
    process.stdout.write(chunk.choices[0]?.delta?.content || "");
}