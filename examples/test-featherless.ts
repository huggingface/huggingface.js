import { HfInference } from "../packages/inference/dist";
import * as dotenv from "dotenv";

dotenv.config();

async function main() {
	const inference = new HfInference(process.env.HF_FEATHERLESS_KEY);

	try {
		// Test text generation
		console.log("Testing text generation...");
		const response = await inference.textGeneration({
			model: "featherless/mixtral-8x7b",
			provider: "featherless",
			inputs: "Paris is",
			parameters: {
				temperature: 0,
				max_tokens: 10,
			},
		});
		console.log("Response:", response);

		// Test streaming
		console.log("\nTesting streaming...");
		const stream = await inference.textGenerationStream({
			model: "featherless/mixtral-8x7b",
			provider: "featherless",
			inputs: "Paris is",
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
