import type { Tool } from "../types";

export const imageToTextTool: Tool = {
	name: "imageToText",
	description: "Caption an image.",
	examples: [
		{
			prompt: "Describe the image",
			code: "imageToText(image)",
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
