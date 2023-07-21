import type { Tool } from "../types";

export const textToSpeechTool: Tool = {
	name: "textToSpeech",
	description: "This tool takes a text input and turns it into an audio file.",
	examples: [
		{
			prompt: 'Say the following out loud:"Hello world!"',
			code: "textToSpeech('Hello world!')",
			tools: ["textToSpeech"],
		},
		{
			prompt: "Say the content of the string txt out loud",
			code: "textToSpeech(txt)",
			tools: ["textToSpeech"],
		},
	],
	call: async (input, inference) => {
		const data = await input;
		if (typeof data !== "string") throw "Input must be a string.";

		return inference.textToSpeech(
			{
				inputs: data,
				model: "espnet/kan-bayashi_ljspeech_vits",
			},
			{ wait_for_model: true }
		);
	},
};
