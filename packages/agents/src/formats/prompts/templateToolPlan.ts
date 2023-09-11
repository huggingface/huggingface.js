import { compileTemplate } from "../../utils/template";
import type { Files, Tool } from "../../types";

export const templateToolPlan = compileTemplate<{
	prompt: string;
	files: Files;
	tools: Tool[];
}>(`I am prompting you with the following message: "{{prompt}}"

What is your plan for using tools in this situation? Be concise, use the LEAST amount of tools. It is okay to use only one tool if necessary. Write your steps as bullet points, and mention ONLY the name of the tools you want to use wrapped in backticks. For example, \`tool name\` is a tool I want to use.

For example if the query is: "Describe the content of this image" then you can have the following plan:
1. Use the tool \`imageToText\` to describe the [[input]] image.

Or if the query is "Read out loud the name of the current president of Ireland" then you could have the following plan:
1. Use the tool \`webSearch\` to find the name of the current president of Ireland.
2. Use the tool \`textToSpeech\` to read out loud the name of the president.

If the query is "Generate a picture of a cat" then you could have the following plan:
1. Use the tool \`textToImage\` to generate a picture of a cat.
`);
