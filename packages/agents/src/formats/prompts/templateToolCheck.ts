import { compileTemplate } from "../../utils/template";
import type { Files, Tool } from "../../types";

export const templateToolCheck = compileTemplate<{
	prompt: string;
	files: Files;
	tools: Tool[];
}>(`I am prompting you with the following message: "{{prompt}}"

If you don't need a tool you will be prompted to answer the question directly, using your knowledge of the world. 

For example, if you are asked "What is the capital of France?", you can answer "Paris" directly, without the need for tools.

If the user asks you "Who was Napoléon Bonaparte" then you can just answer directly, as you already know the answer.

If the user asks you to perform an action, for example "Can you draw a picture of a cat?" or "Generate a picture of a skyscraper in tokyo" you need to use a tool. Most actions will require a tool. When in doubt, use a tool with "YES".

Do you need to use a tool? (answer with YES or NO only.)`);
