import type { TextToSpeechArgs, TextToSpeechOutput } from "@huggingface/inference";
import type { Tool } from "../types/public";

export const textToSpeechTool: Tool<TextToSpeechArgs["inputs"], TextToSpeechOutput> = {
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
	call: async (input, inference) =>
		inference.textToSpeech(
			{
				inputs: await input,
				model: "espnet/kan-bayashi_ljspeech_vits",
			},
			{ wait_for_model: true }
		),
};
