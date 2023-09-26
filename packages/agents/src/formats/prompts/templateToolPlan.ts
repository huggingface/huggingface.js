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

You have access to the following tools. You can pick ONLY ONE tool.
{{#each tools}}
\`{{name}}\` - {{description}}{{#unless @last}}\n{{/unless}}
{{/each}}

Here are some examples:
- User: "Show me the news for September 26th 2023"
- Plan: I can use the tool \` webSearch \` to get the news for September 26th 2023 and then generate an answer based on the generated context.

- User: "Show me a cute mouse with a green hat"
- Plan: "I can use the tool \`textToImage\` to get an image of a mouse with a green hat and then pass it to the user.

- User: "Who is Julien Chaumond?"
- Plan: "I can use the tool \`webSearch\` to search for "Julien Chaumond"  then generate an answer based on the generated context.

The prompt is: {{prompt}}

What is your plan for using tools in this situation? Be concise, use only one tool. It is okay to use only one tool if necessary. Write your steps as bullet points, and mention ONLY the name of the tool you want to use wrapped in backticks. For example, \`tool name\` is a tool I want to use.`);
