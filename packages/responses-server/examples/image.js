import OpenAI from "openai";

const openai = new OpenAI({ baseURL: "http://localhost:3000/v1", apiKey: process.env.HF_TOKEN });

const response = await openai.responses.create({
	model: "Qwen/Qwen2.5-VL-7B-Instruct",
	input: [
		{
			role: "user",
			content: [
				{ type: "input_text", text: "what is in this image?" },
				{
					type: "input_image",
					image_url:
						"https://upload.wikimedia.org/wikipedia/commons/thumb/d/dd/Gfp-wisconsin-madison-the-nature-boardwalk.jpg/2560px-Gfp-wisconsin-madison-the-nature-boardwalk.jpg",
				},
			],
		},
	],
});

console.log(response);
console.log(response.output_text);
