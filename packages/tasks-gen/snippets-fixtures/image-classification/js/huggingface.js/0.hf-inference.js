import { InferenceClient } from "@huggingface/inference";

const client = new InferenceClient("api_token");

const data = fs.readFileSync("cats.jpg");

const output = await client.imageClassification({
	data,
	model: "Falconsai/nsfw_image_detection",
	provider: "hf-inference",
});

console.log(output);