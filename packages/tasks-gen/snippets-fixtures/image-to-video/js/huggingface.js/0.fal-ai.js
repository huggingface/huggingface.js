import { InferenceClient } from "@huggingface/inference";

const client = new InferenceClient(process.env.HF_TOKEN);

const data = fs.readFileSync("cat.png");

const video = await client.imageToVideo({
	provider: "fal-ai",
	model: "Wan-AI/Wan2.2-I2V-A14B",
	inputs: data,
	parameters: { prompt: "The cat starts to dance", },
});

/// Use the generated video (it's a Blob)
// For example, you can save it to a file or display it in a video element