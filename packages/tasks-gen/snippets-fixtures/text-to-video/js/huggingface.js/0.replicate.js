import { InferenceClient } from "@huggingface/inference";

const client = new InferenceClient(process.env.HF_TOKEN);

const video = await client.textToVideo({
    provider: "replicate",
    model: "tencent/HunyuanVideo",
	inputs: "A young man walking on the street",
});
// Use the generated video (it's a Blob)