import type { Tool } from "../types";

import { generatePrompt } from "./promptGeneration";
import { messageTool } from "../tools/message";

export async function generateCode(
	prompt: string,
	tools: Tool[],
	files: FileList | undefined,
	llm: (input: string) => Promise<string>
): Promise<string> {
	const fullprompt = generatePrompt(prompt, [...tools, messageTool], {
		image: !!files && files[0].type.startsWith("image"),
		audio: !!files && files[0].type.startsWith("audio"),
	});

	const textAnswer = await llm(fullprompt);

	try {
		const regex = /```(.*?)```/gs;
		const matches = [...textAnswer.matchAll(regex)];

		const codeBlocks = matches.map((match) => match[1]);
		return codeBlocks[0].replace("js", "").replace("javascript", "").trim() ?? "nothing";
	} catch {
		throw new Error("The generated text doesn't contain any code blocks.");
	}
}
