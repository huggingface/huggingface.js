import { compileTemplate } from "../../utils/template";
import type { Files, Tool } from "../../types";

export const templateToolStep = compileTemplate<{
	prompt: string;
	files: Files;
	tools: Tool[];
}>(`What tool do you want to use now ? Answers must take the form 

\`\`\`json
{
	"tool": "tool name",
	"input": "tool input"
}
\`\`\`

The prompt is: {{prompt}}

If you do not need another tool, you can return the following format to give your final answer:

\`\`\`json
{
	"tool": "finalAnswer",
	"input": "your final answer based on your knowledge of the world and prior tools used"
}
\`\`\`

Only this format will be accepted as a final answer.

If you are done with your plan, consider using \`finalAnswer\` tool to give your final answer based on your knowledge of the world and prior tools used.

ONLY answer with ONE step at a time. Only the first JSON will be accepted.
`);
