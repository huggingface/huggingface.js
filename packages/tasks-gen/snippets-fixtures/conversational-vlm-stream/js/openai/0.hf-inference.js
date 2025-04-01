import { OpenAI } from "openai";

const client = new OpenAI({
	baseURL: "https://router.huggingface.co/hf-inference/models/meta-llama/Llama-3.2-11B-Vision-Instruct/v1",
	apiKey: "api_token",
});

let out = "";

const stream = await client.chat.completions.create({
    provider: "hf-inference",
    model: "meta-llama/Llama-3.2-11B-Vision-Instruct",
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
    max_tokens: 500,
});

for await (const chunk of stream) {
	if (chunk.choices && chunk.choices.length > 0) {
		const newContent = chunk.choices[0].delta.content;
		out += newContent;
		console.log(newContent);
	}  
}