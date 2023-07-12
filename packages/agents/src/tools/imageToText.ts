import type { ImageToTextArgs, ImageToTextOutput } from "@huggingface/inference";
import type { Tool } from "../types/public";

export const imageToTextTool: Tool<ImageToTextArgs["data"], ImageToTextOutput["generated_text"]> = {
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
		return (
			await inference.imageToText(
				{
					data: await input,
					model: "nlpconnect/vit-gpt2-image-captioning",
				},
				{ wait_for_model: true }
			)
		).generated_text;
	},
};
