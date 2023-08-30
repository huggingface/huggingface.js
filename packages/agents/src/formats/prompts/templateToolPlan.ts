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

What is your plan for using tools in this situation?`);
