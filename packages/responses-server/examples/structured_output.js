import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import { z } from "zod";

const openai = new OpenAI({ baseURL: "http://localhost:3000/v1", apiKey: process.env.HF_TOKEN });

const Step = z.object({
	explanation: z.string(),
	output: z.string(),
});

const MathReasoning = z.object({
	steps: z.array(Step),
	final_answer: z.string(),
});

const response = await openai.responses.parse({
	model: "Qwen/Qwen2.5-VL-72B-Instruct",
	provider: "cerebras",
	input: [
		{
			role: "system",
			content: "You are a helpful math tutor. Guide the user through the solution step by step.",
		},
		{ role: "user", content: "how can I solve 8x + 7 = -23" },
	],
	text: {
		format: zodTextFormat(MathReasoning, "math_reasoning"),
	},
});

console.log(response.output_parsed);
