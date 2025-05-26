import type { Tool } from '../types.js';

export const speechToTextTool: Tool = {
	name: "speechToText",
	description: "Transcribe an audio file and returns its text content.",
	examples: [
		{
			prompt: "Transcribe the sound file",
			code: "speechToText(audio)",
			tools: ["speechToText"],
		},
	],
	call: async (input, inference) => {
		const data = await input;
		if (typeof data === "string") throw "Input must be a blob.";

		return (
			await inference.automaticSpeechRecognition({
				data,
			})
		).text;
	},
};
