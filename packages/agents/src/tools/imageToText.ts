import type { Tool } from "../types";

export const imageToTextTool: Tool = {
	name: "imageToText",
	mime: "text/plain",
	description:
		"Caption an image. Useful when the user wants a text description out of an image. Keywords: Image to text, Image captioning, Describe image",

	examples: [
		{
			prompt: "Describe the image",
			code: '{"tool" : "imageToText", "input" : "[[input]]"}',
			tools: ["imageToText"],
		},
	],
	call: async (input, inference) => {
		const data = await input;
		if (typeof data === "string") throw "Input must be a blob.";

		return (
			await inference.imageToText(
				{
					data,
				},
				{ wait_for_model: true }
			)
		).generated_text;
	},
};
