import { compileTemplate } from "../../utils/template";
import type { Tool } from "../../types";

export const templateToolPlan = compileTemplate<{
	prompt: string;
	image: boolean;
	audio: boolean;
	tools: Tool[];
}>(`I am prompting you with the following message: "{{prompt}}"

{{#if image}}
And I have embedded an image
{{/if}}
{{#if audio}}
And I have embedded an audio file
{{/if}}

You have access to the following tools: 
{{#each tools}}
\`{{name}}\` - {{description}}{{#unless @last}}\n{{/unless}}
{{/each}}

The prompt is: {{prompt}}

What is your plan for using tools in this situation? Be concise, use the LEAST amount of tools, write your steps as bullet points, and mention ONLY the name of the tools you want to use wrapped in backticks. For example, \`tool name\` is a tool I want to use.`);
