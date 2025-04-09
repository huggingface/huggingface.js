import { InferenceClient } from "@huggingface/inference";

const client = new InferenceClient("api_token");

const image = await client.textToVideo({
    provider: "fal-ai",
    model: "tencent/HunyuanVideo",
	inputs: "A young man walking on the street",
});
// Use the generated video (it's a Blob)