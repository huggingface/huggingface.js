import { OpenAI } from "openai";

const openai = new OpenAI({ baseURL: "http://localhost:3000/v1", apiKey: process.env.HF_TOKEN });

const tools = [
	{
		type: "function",
		name: "get_weather",
		description: "Get current temperature for provided coordinates in celsius.",
		parameters: {
			type: "object",
			properties: {
				latitude: { type: "number" },
				longitude: { type: "number" },
			},
			required: ["latitude", "longitude"],
			additionalProperties: false,
		},
		strict: true,
	},
];

const stream = await openai.responses.create({
	model: "meta-llama/Llama-3.3-70B-Instruct",
	provider: "cerebras",
	input: [{ role: "user", content: "What's the weather like in Paris today?" }],
	tools,
	stream: true,
});

for await (const event of stream) {
	console.log(event);
}
