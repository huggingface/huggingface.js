import { compileTemplate } from "../../utils/template";
import type { Message } from "../../types";

export const templateMixtral = compileTemplate<{ messages: Message[]; preprompt?: string }>(
	`<s> {{#each messages}}{{#ifUser}}[INST]{{#if @first}}{{#if @root.preprompt}}{{@root.preprompt}}\n{{/if}}{{/if}} {{content}} [/INST]{{/ifUser}}{{#ifAssistant}} {{content}}</s> {{/ifAssistant}}{{/each}}`
);
