import { compileTemplate } from "../../utils/template";
import type { Message } from "../../types";

export const templateOpenAssistant = compileTemplate<{
	messages: Message[];
	preprompt?: string;
}>(`{{#if preprompt}}
{{preprompt}}
{{/if}}
{{#each messages}}{{#ifUser}}<|prompter|>{{content}}</s>{{/ifUser}}{{#ifAssistant}}<|assistant|>{{content}}</s>{{/ifAssistant}}{{/each}}`);
