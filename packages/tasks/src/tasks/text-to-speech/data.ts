import type { TaskDataCustom } from "..";

const taskData: TaskDataCustom = {
	canonicalId: "text-to-audio",
	datasets: [
		{
			description: "10K hours of multi-speaker English dataset.",
			id: "parler-tts/mls_eng_10k",
		},
		{
			description: "Multi-speaker English dataset.",
			id: "LibriTTS",
		},
	],
	demo: {
		inputs: [
			{
				label: "Input",
				content: "I love audio models on the Hub!",
				type: "text",
			},
		],
		outputs: [
			{
				filename: "audio.wav",
				type: "audio",
			},
		],
	},
	metrics: [
		{
			description: "The Mel Cepstral Distortion (MCD) metric is used to calculate the quality of generated speech.",
			id: "mel cepstral distortion",
		},
	],
	models: [
		{
			description: "A powerful TTS model.",
			id: "suno/bark",
		},
		{
			description: "A massively multi-lingual TTS model.",
			id: "facebook/mms-tts",
		},
		{
			description: "A prompt based, powerful TTS model.",
			id: "parler-tts/parler_tts_mini_v0.1",
		},
	],
	spaces: [
		{
			description: "An application for generate highly realistic, multilingual speech.",
			id: "suno/bark",
		},
		{
			description: "XTTS is a Voice generation model that lets you clone voices into different languages.",
			id: "coqui/xtts",
		},
		{
			description: "An application that synthesizes speech for diverse speaker prompts.",
			id: "parler-tts/parler_tts_mini",
		},
	],
	summary:
		"Text-to-Speech (TTS) is the task of generating natural sounding speech given text input. TTS models can be extended to have a single model that generates speech for multiple speakers and multiple languages.",
	widgetModels: ["suno/bark"],
	youtubeId: "NW62DpzJ274",
};

export default taskData;
