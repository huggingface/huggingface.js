import type { TaskDataCustom } from "../index.js";

const taskData: TaskDataCustom = {
	datasets: [
		{
			description: "Instructions composed of audio and text.",
			id: "homebrewltd/instruction-speech-encodec-v1.5",
		},
	],
	demo: {
		inputs: [
			{
				filename: "sample1.flac",
				type: "audio",
			},
			{
				label: "Text Prompt",
				content: "Transcribe this audio.",
				type: "text",
			},
		],
		outputs: [
			{
				label: "Answer",
				content: "Going along slushy country roads and speaking to damp audiences in...",
				type: "text",
			},
		],
	},
	metrics: [],
	models: [
		{
			description: "Small yet powerful audio language model.",
			id: "fixie-ai/ultravox-v0_5-llama-3_2-1b",
		},
		{
			description: "Audio Language Model based on Llama 3.1. 8b",
			id: "homebrewltd/Ichigo-llama3.1-s-instruct-v0.4",
		},
		{
			description: "Strong Audio Language Model.",
			id: "Qwen/Qwen2-Audio-7B",
		},
	],
	spaces: [
		{
			description: "Powerful audio-language model assistant.",
			id: "Qwen/Qwen2-Audio-Instruct-Demo",
		},
		{
			description: "Real-time audio-text-to-text model.",
			id: "Steveeeeeeen/talk-to-ultravox-0.5",
		},
	],
	summary:
		"Audio-text-to-text models extend multimodal AI into the speech domain. Much like their visual counterparts, these models are designed to understand and generate text based on audio inputs. Recent research in spoken dialogue systems and Speech Large Language Models (LLMs) highlights how such models are evolving, leveraging both semantic and acoustic representations extracted from speech signals.",
	widgetModels: [],
};

export default taskData;
