import type { Tool } from "../types";

export const messageTool: Tool = {
	name: "message",
	description: "Send data back to the user.",
	examples: [
		{
			prompt: "Display the created image",
			code: 'message("we display the image", image)',
			tools: ["message"],
			inputs: { image: true },
		},
		{
			prompt: "Display the generated text",
			code: 'message("we render the text", text)',
			tools: ["message"],
		},
		{
			prompt: 'Display the text "hello world"',
			code: 'message("hello world")',
			tools: ["message"],
		},
	],
};
