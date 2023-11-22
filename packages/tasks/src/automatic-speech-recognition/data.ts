import type { TaskDataCustom } from "../Types";

const taskData: TaskDataCustom = {
	datasets: [
		{
			description: "18,000 hours of multilingual audio-text dataset in 108 languages.",
			id: "mozilla-foundation/common_voice_13_0",
		},
		{
			description: "An English dataset with 1,000 hours of data.",
			id: "librispeech_asr",
		},
		{
			description: "High quality, multi-speaker audio data and their transcriptions in various languages.",
			id: "openslr",
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
				/// GOING ALONG SLUSHY COUNTRY ROADS AND SPEAKING TO DAMP AUDIENCES I
				label: "Transcript",
				content: "Going along slushy country roads and speaking to damp audiences in...",
				type: "text",
			},
		],
	},
	metrics: [
		{
			description: "",
			id: "wer",
		},
		{
			description: "",
			id: "cer",
		},
	],
	models: [
		{
			description: "A powerful ASR model by OpenAI.",
			id: "openai/whisper-large-v3",
		},
		{
			description: "A good generic ASR model by MetaAI.",
			id: "facebook/wav2vec2-base-960h",
		},
		{
			description: "An end-to-end model that performs ASR and Speech Translation by MetaAI.",
			id: "facebook/s2t-small-mustc-en-fr-st",
		},
	],
	spaces: [
		{
			description: "A powerful general-purpose speech recognition application.",
			id: "hf-audio/whisper-large-v3",
		},
		{
			description: "Fastest speech recognition application.",
			id: "sanchit-gandhi/whisper-jax",
		},
		{
			description: "A high quality speech and text translation model by Meta.",
			id: "facebook/seamless_m4t",
		},
	],
	summary:
		"Automatic Speech Recognition (ASR), also known as Speech to Text (STT), is the task of transcribing a given audio to text. It has many applications, such as voice user interfaces.",
	widgetModels: ["openai/whisper-large-v3"],
	youtubeId: "TksaY_FDgnk",
};

export default taskData;
