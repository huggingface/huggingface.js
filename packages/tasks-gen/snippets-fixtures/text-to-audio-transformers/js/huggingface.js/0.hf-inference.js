import { InferenceClient } from "@huggingface/inference";

const client = new InferenceClient(process.env.HF_TOKEN);

const audio = await client.textToAudio({
    provider: "hf-inference",
    model: "facebook/musicgen-small",
	inputs: "liquid drum and bass, atmospheric synths, airy sounds",
});
// Use the generated audio (it's a Blob)