import type { Files } from "../../types";
import { compileTemplate } from "../../utils/template";

export const templateFinalAnswer = compileTemplate<{
	prompt: string;
	files: Files;
}>(`You can no longer use any tools to answer this question.

{{#each files}}
{{#if @first}}
The following files will be shown to the user. You don't have to do anything to display them to the user. Those images can be shown and you are capable of creating images. Do not reference them directly.
{{/if}}
\` - [[{{@key}}]]\` {{#unless @last}}\n{{/unless}}
{{/each}}

Answer your best guess to the initial question: {{prompt}} 
`);
