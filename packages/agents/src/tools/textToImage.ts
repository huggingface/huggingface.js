import type { Tool } from "../types";

export const textToImageTool: Tool = {
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
		const data = await input;
		if (typeof data !== "string") throw "Input must be a string.";

		return await inference.textToImage(
			{
				inputs: data,
			},
			{ wait_for_model: true }
		);
	},
};
