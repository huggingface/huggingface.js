import { compileTemplate } from "../../utils/template";
import type { Message } from "../../types";

export const templateLlama2 = compileTemplate<{ messages: Message[]; preprompt?: string }>(`<s>[INST] <<SYS>>
{{#if preprompt}}
{{preprompt}}
{{/if}}
<</SYS>>

{{#each messages}}{{#ifUser}}{{content}} [/INST] {{/ifUser}}{{#ifAssistant}}{{content}} </s><s>[INST] {{/ifAssistant}}{{/each}}`);
