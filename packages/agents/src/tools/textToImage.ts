import type { TextToImageArgs, TextToImageOutput } from "@huggingface/inference";
import type { Tool } from "../types/public";

export const textToImageTool: Tool<TextToImageArgs["inputs"], TextToImageOutput> = {
	name: "textToImage",
	description: "Generate an image from a text prompt.",
	examples: [
		{
			prompt: "Generate an image of a cat wearing a top hat",
			code: "textToImage('cat wearing a top hat')",
			tools: ["textToImage"],
		},
		{
			prompt: "Draw a brown dog on a beach",
			code: "textToImage('drawing of a brown dog on a beach')",
			tools: ["textToImage"],
		},
	],
	call: async (input, inference) => {
		return await inference.textToImage(
			{
				inputs: await input,
				model: "stabilityai/stable-diffusion-2",
			},
			{ wait_for_model: true }
		);
	},
};
