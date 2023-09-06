import type { Tool } from "../types";

export const speechToTextTool: Tool = {
	name: "speechToText",
	description:
		"Transcribe an audio file and returns its text content. This is needed when the user asks to get text out of an audio file. Keywords: Transcribe, Speech to text, Audio to text",
	examples: [
		{
			prompt: "Transcribe the sound file",
			code: '{"tool" : "speechToText", "input" : "[[input]]"}',
			tools: ["speechToText"],
		},
	],
	call: async (input, inference) => {
		const data = await input;
		if (typeof data === "string") throw "Input must be a blob.";

		return (
			await inference.automaticSpeechRecognition(
				{
					data,
				},
				{ wait_for_model: true }
			)
		).text;
	},
};
