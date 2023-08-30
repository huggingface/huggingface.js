import { compileTemplate } from "../../utils/template";
import type { Tool } from "../../types";

export const templateToolCheck = compileTemplate<{
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

If you don't need a tool you will be prompted to answer the question directly, using your knowledge of the world. 

For example, if you are asked "What is the capital of France?", you can answer "Paris" directly, without the need for tools.

If the user asks you "Who was Napoléon Bonaparte" then you can just answer directly, as you already know the answer.

If the user asks you to perform an action, for example "Can you draw a picture of a cat?" then you need to use a tool.

The prompt is: {{prompt}}

You have access to the following tools: 
{{#each tools}}
\`{{name}}\` - {{description}}{{#unless @last}}\n{{/unless}}
{{/each}}


Do you need to use a tool? (answer with yes/no ONLY)`);
