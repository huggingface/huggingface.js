import { InferenceClient } from "@huggingface/inference";

const client = new InferenceClient(process.env.API_TOKEN);

const chatCompletion = await client.chatCompletion({
    endpointUrl: "http://localhost:8080/v1",
    model: "meta-llama/Llama-3.1-8B-Instruct",
    messages: [
        {
            role: "user",
            content: "What is the capital of France?",
        },
    ],
});

console.log(chatCompletion.choices[0].message);