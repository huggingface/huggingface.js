import { HfInference } from "@huggingface/inference";

const client = new HfInference("api_token");

const video = await client.textToVideo({
	model: "tencent/HunyuanVideo",
	provider: "fal-ai",
	inputs: "A young man walking on the street",
	parameters: { num_inference_steps: 5 },
});
// Use the generated video (it's a Blob)
