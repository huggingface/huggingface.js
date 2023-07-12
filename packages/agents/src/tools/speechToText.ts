import type { AutomaticSpeechRecognitionArgs, AutomaticSpeechRecognitionOutput } from "@huggingface/inference";
import type { Tool } from "../types/public";

export const speechToTextTool: Tool<AutomaticSpeechRecognitionArgs["data"], AutomaticSpeechRecognitionOutput["text"]> =
	{
		name: "speechToText",
		description: "Caption an audio file and returns its text content.",
		examples: [
			{
				prompt: "Transcribe the sound file",
				code: "speechToText(audio)",
				tools: ["speechToText"],
			},
		],
		call: async (data, inference) => {
			return (
				await inference.automaticSpeechRecognition(
					{
						data: await data,
						model: "facebook/wav2vec2-large-960h-lv60-self",
					},
					{ wait_for_model: true }
				)
			).text;
		},
	};
