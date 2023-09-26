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
	"input" : "tool input"
}
\`\`\`

You have access to the following tools:
{{#each tools}}
\`{{name}}\` - {{description}}
 - Examples: 
 {{#each examples}}\n{{prompt}} - \`{{code}}\` {{/each}}
{{#unless @last}}\n{{/unless}}
{{/each}}

{{#each files}}
{{#if @first}}
You have access to the following files. Having a file means you can embed it in your answer by wrapping it in double brackets like so : [[input]]
{{/if}}
\` - [[{{@key}}]]\` {{#unless @last}}\n{{/unless}}
{{/each}}

The prompt is: {{prompt}}

ONLY answer with ONE step at a time. Only the first JSON will be accepted.
`);
