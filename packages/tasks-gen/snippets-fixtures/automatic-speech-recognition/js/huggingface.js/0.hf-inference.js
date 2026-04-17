import { InferenceClient } from "@huggingface/inference";

const client = new InferenceClient(process.env.HF_TOKEN);

const data = fs.readFileSync("sample1.flac");

const output = await client.automaticSpeechRecognition({
	data,
	model: "openai/whisper-large-v3-turbo",
	provider: "hf-inference",
});

console.log(output);