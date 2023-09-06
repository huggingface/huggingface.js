import { compileTemplate } from "../../utils/template";
import type { Files, Tool } from "../../types";

export const templateToolPlan = compileTemplate<{
	prompt: string;
	files: Files;
	tools: Tool[];
}>(`I am prompting you with the following message: "{{prompt}}"

{{#each files}}
{{#if @first}}
You have access to the following files. Having a file means you can embed it in your answer by wrapping it in double brackets like so : [[input]]
{{/if}}
\` - [[{{@key}}]]\` {{#unless @last}}\n{{/unless}}
{{/each}}

You have access to the following tools: 
{{#each tools}}
\`{{name}}\` - {{description}}{{#unless @last}}\n{{/unless}}
{{/each}}

The prompt is: {{prompt}}

What is your plan for using tools in this situation? Be concise, use the LEAST amount of tools. It is okay to use only one tool if necessary. Write your steps as bullet points, and mention ONLY the name of the tools you want to use wrapped in backticks. For example, \`tool name\` is a tool I want to use.`);
