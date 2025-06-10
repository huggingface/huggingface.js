import { OpenAI } from "openai";

const client = new OpenAI({
	baseURL: "https://router.huggingface.co/fireworks-ai/inference/v1",
	apiKey: process.env.HF_TOKEN,
});

const stream = await client.chat.completions.create({
    model: "<fireworks-ai alias for meta-llama/Llama-3.2-11B-Vision-Instruct>",
    messages: [
        {
            role: "user",
            content: [
                {
                    type: "text",
                    text: "Describe this image in one sentence.",
                },
                {
                    type: "image_url",
                    image_url: {
                        url: "https://cdn.britannica.com/61/93061-050-99147DCE/Statue-of-Liberty-Island-New-York-Bay.jpg",
                    },
                },
            ],
        },
    ],
    stream: true,
});

for await (const chunk of stream) {
    process.stdout.write(chunk.choices[0]?.delta?.content || "");
}