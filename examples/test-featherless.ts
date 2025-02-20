import { HfInference } from "../packages/inference/dist";
import * as dotenv from "dotenv";

dotenv.config();

async function main() {
	const inference = new HfInference(process.env.HF_FEATHERLESS_KEY);

	try {
		// Test text generation
		const response = await inference.textGeneration({
			model: "ChenWeiLi/MedLlama-3-8B_DARE",
			provider: "featherless",
			messages: [
				{
					role: "user",
					content: "Paris is",
				},
			],
			parameters: {
				temperature: 0,
				max_tokens: 10,
			},
		});
		console.log("Response:", response);

		// Test streaming
		console.log("\nTesting streaming...");
		const stream = await inference.textGenerationStream({
			model: "ChenWeiLi/MedLlama-3-8B_DARE",
			provider: "featherless",
			messages: [
				{
					role: "user",
					content: "Paris is",
				},
			],
			parameters: {
				temperature: 0,
				max_tokens: 10,
			},
		});

		for await (const chunk of stream) {
			if (chunk.token) {
				process.stdout.write(chunk.token.text);
			}
		}
		console.log("\nStreaming complete!");
	} catch (error) {
		console.error("Error:", error);
	}
}

main();
