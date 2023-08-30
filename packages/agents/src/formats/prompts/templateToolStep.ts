import { compileTemplate } from "../../utils/template";
import type { Tool } from "../../types";

export const templateToolStep = compileTemplate<{
	prompt: string;
	image: boolean;
	audio: boolean;
	tools: Tool[];
}>(`What tool do you want to use now ? Answers must take the form 

\`\`\`json
{
	"tool": "tool name",
	"input" : "tool input"
}
\`\`\`

For example if you want to draw a picture of a cat wearing a top hat, you might use the \`textToImage\` tool like this:

\`\`\`json
{
	"tool": "textToImage",
	"input" : "cat wearing a top hat"
}
\`\`\`

{{#if image}}
You can access embedded files like so: 

\`\`\`json
{
	"tool": "image",
	"input" : "[[input]]"
}
\`\`\`
The embedded image will be automatically passed to the tool as the input.

For example to caption an incoming image:

\`\`\`json
{
	"tool": "imageToText",
	"input" : "[[input]]"
}
\`\`\`
{{/if}}

{{#if audio}}
You can access embedded files like so: 

\`\`\`json
{
	"tool": "image",
	"input" : "[[input]]"
}
\`\`\`
The embedded audio will be automatically passed to the tool as the input.

For example to caption an incoming audio file:

\`\`\`json
{
	"tool": "speechToText",
	"input" : "[[input]]"
}
\`\`\`
{{/if}}


The prompt is: {{prompt}}

You have access to the following tools:
{{#each tools}}
\`{{name}}\` - {{description}}{{#unless @last}}\n{{/unless}}
{{/each}}

If you do not need another tool, you can return the following, to give your final answer:

\`\`\`json
{
	"tool": "finalAnswer",
	"input" : "your final answer based on your knowledge of the world and prior tools used"
}
\`\`\`

If you are done with your plan, consider using \`finalAnswer\` tool to give your final answer based on your knowledge of the world and prior tools used.

ONLY express ONE step at a time. Only the first JSON will be accepted.
`);
