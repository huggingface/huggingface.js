import type { Files } from "../../types";
import { compileTemplate } from "../../utils/template";

export const templateFinalAnswer = compileTemplate<{
	prompt: string;
	files: Files;
}>(`You can no longer use any tools to answer this question.

{{#each files}}
{{#if @first}}
You have access to the following files. Having a file means you can embed it in your answer by wrapping it in double brackets like so : [[input]]
{{/if}}
\` - [[{{@key}}]]\` {{#unless @last}}\n{{/unless}}
{{/each}}

You can embed a file in your answer by wrapping it in double brackets like so : [[input]]

Answer your best guess to the initial question: {{prompt}} 

Use this format for your final answer:

\`\`\`json
{
	"tool": "finalAnswer",
	"input" : "your final answer based on your knowledge of the world and prior tools used"
}
\`\`\`

Only this format will be accepted as a final answer.
`);
