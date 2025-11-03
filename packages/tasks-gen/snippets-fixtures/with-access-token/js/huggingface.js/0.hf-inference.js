import { InferenceClient } from "@huggingface/inference";

const client = new InferenceClient("hf_xxx");

const chatCompletion = await client.chatCompletion({
    model: "meta-llama/Llama-3.1-8B-Instruct:hf-inference",
    messages: [
        {
            role: "user",
            content: "What is the capital of France?",
        },
    ],
});

console.log(chatCompletion.choices[0].message);