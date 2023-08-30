import { compileTemplate } from "../../utils/template";
import type { Message } from "../../types";

export const templateLlama2 = compileTemplate<{ messages: Message[] }>(`<s>[INST] <<SYS>>
You are a helpful assistant.
<</SYS>>

{{#each messages}}{{#ifUser}}{{content}} [/INST] {{/ifUser}}{{#ifAssistant}}{{content}} </s><s>[INST] {{/ifAssistant}}{{/each}}`);
