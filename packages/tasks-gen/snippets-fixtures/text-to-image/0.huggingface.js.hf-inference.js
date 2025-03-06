import { HfInference } from "@huggingface/inference";

const client = new HfInference("api_token");

const image = await client.textToImage({
	model: "black-forest-labs/FLUX.1-schnell",
	inputs: "Astronaut riding a horse",
	parameters: { num_inference_steps: 5 },
	provider: "hf-inference",
});
/// Use the generated image (it's a Blob)
