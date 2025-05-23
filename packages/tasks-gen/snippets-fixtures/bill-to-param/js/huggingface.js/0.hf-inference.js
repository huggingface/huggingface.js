import { InferenceClient } from "@huggingface/inference";

const client = new InferenceClient("api_token");

const chatCompletion = await client.chatCompletion({
    provider: "hf-inference",
    model: "meta-llama/Llama-3.1-8B-Instruct",
    messages: [
        {
            role: "user",
            content: "What is the capital of France?",
        },
    ],
}, {
    billTo: "huggingface",
});

console.log(chatCompletion.choices[0].message);