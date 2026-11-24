import { InferenceClient } from "@huggingface/inference";

const client = new InferenceClient(process.env.OPENROUTER_API_KEY);

const chatCompletion = await client.chatCompletion({
    provider: "openrouter",
    model: "meta-llama/Llama-3.1-8B-Instruct",
    messages: [
        {
            role: "user",
            content: "What is the capital of France?",
        },
    ],
});

console.log(chatCompletion.choices[0].message);