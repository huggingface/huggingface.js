import { InferenceClient } from "@huggingface/inference";

const client = new InferenceClient("api_token");

const audio = await client.textToSpeech({
    provider: "fal-ai",
    model: "nari-labs/Dia-1.6B",
	inputs: "The answer to the universe is 42",
});
// Use the generated audio (it's a Blob)