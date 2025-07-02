import { OpenAI } from "openai";
const openai = new OpenAI({ baseURL: "http://localhost:3000/v1", apiKey: process.env.HF_TOKEN });

const stream = await openai.responses.create({
	model: "Qwen/Qwen2.5-VL-7B-Instruct",
	input: [
		{
			role: "user",
			content: "Say 'double bubble bath' ten times fast.",
		},
	],
	stream: true,
});

for await (const event of stream) {
	console.log(event);
}
