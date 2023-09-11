import type { Files, Tool } from "../../types";
import { compileTemplate } from "../../utils/template";

export const templatePreprompt = compileTemplate<{
	tools: Tool[];
	toolExamples?: true;
	files: Files;
}>(`You are a helpful assistant that uses tools to answer user questions. 

You have access to the following tools:
{{#each tools}}
\`{{name}}\` - {{description}}
Examples:
{{#each examples}}\n{{this.prompt}} - \`{{this.code}}\` \n{{/each}}
{{#unless @last}}\n{{/unless}}
{{/each}}

{{#each files}}
{{#if @first}}
You have access to the following files. Having a file means you can embed it in your answer by wrapping it in double brackets like so : [[input]]
{{/if}}
\` - [[{{@key}}]]\` {{this.description}} {{#unless @last}}\n{{/unless}}
{{/each}}
`);
