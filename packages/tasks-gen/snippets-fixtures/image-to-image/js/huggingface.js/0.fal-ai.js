import { InferenceClient } from "@huggingface/inference";

const client = new InferenceClient(process.env.HF_TOKEN);

const data = fs.readFileSync("cat.png");

const image = await client.imageToImage({
	provider: "fal-ai",
	model: "black-forest-labs/FLUX.1-Kontext-dev",
	inputs: data,
	parameters: { prompt: "Turn the cat into a tiger.", },
});
/// Use the generated image (it's a Blob)
// For example, you can save it to a file or display it in an image element