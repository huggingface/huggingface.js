import type { Tool } from "../types";

export const textToSpeechTool: Tool = {
	name: "textToSpeech",
	mime: "audio/flac",
	model: "espnet/kan-bayashi_ljspeech_vits",
	description:
		"This tool takes a text input and turns it into an audio file. Keywords: Text to speech, TTS, Speak out loud, Say out loud",
	examples: [
		{
			prompt: 'Say the following out loud:"Hello world!"',
			code: '{"tool" : "textToSpeech", "input" : "Hello world!"}',
			tools: ["textToSpeech"],
		},
		{
			prompt: "Read the name of the irish president out loud",
			code: '{"tool" : "textToSpeech", "input" : "Michael D. Higgins"}',
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
