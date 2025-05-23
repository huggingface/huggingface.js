import type { TaskDataCustom } from "../index.js";

const taskData: TaskDataCustom = {
	datasets: [
		{
			description: "A massively multilingual speech corpus, excellent for training speech recognition models.",
			id: "mozilla-foundation/common_voice_11_0", // Mozilla Common Voice (example)
		},
		{
			description: "A benchmark dataset for speech translation.",
			id: "facebook/covost2", // CoVoST 2 (example for speech translation)
		},
	],
	demo: {
		inputs: [
			{
				filename: "input.flac",
				type: "audio",
			},
		],
		outputs: [
			{
				label: "Output", // Generic label, will be "Transcription" or "Translation"
				content: "This is a sample transcription or translation from the audio.",
				type: "text",
			},
		],
	},
	metrics: [
		{
			description: "Word Error Rate (WER) is a common metric for the accuracy of an automatic speech recognition system. The lower the WER, the better.",
			id: "wer",
		},
		{
			description: "BLEU (Bilingual Evaluation Understudy) score is often used to measure the quality of machine translation from one language to another.",
			id: "bleu",
		},
	],
	models: [
		{
			description: "A popular multilingual model for automatic speech recognition.",
			id: "openai/whisper-base",
		},
		{
			description: "A model for translating speech from English to German (example of a speech translation model).",
			id: "facebook/s2t-medium-en-de-st",
		},
	],
	spaces: [
		{
			description: "A demonstration of the Whisper model for speech recognition.",
			id: "openai/whisper",
		},
		{
			description: "An ESPnet demo that can perform speech recognition and translation.",
			id: "espnet/espnet_asr_demo",
		},
	],
	summary:
		"Audio Text to Text tasks convert audio input into textual output. This primarily includes automatic speech recognition (transcribing audio to text in the same language) and speech translation (translating audio in one language to text in another).",
	widgetModels: ["openai/whisper-base"],
	youtubeId: "SqE7xeyjBFg", // Example: A video about Whisper
};

export default taskData;
