# `@huggingface/ollama-utils`

Various utilities for maintaining Ollama compatibility with models on Hugging Face hub.

Documentation: https://huggingface.co/docs/hub/en/ollama

## Chat template converter

```ts
import { convertJinjaToGoTemplate } from "@huggingface/ollama-utils";

const MODEL_INFO_URL = "https://huggingface.co/api/models/bartowski/Llama-3.2-3B-Instruct-GGUF?expand[]=gguf";
const modelInfo = await (await fetch(MODEL_INFO_URL)).json();
console.log(modelInfo);
/**
 * {
 *   gguf: {
 *     chat_template: "here is the Jinja chat template",
 *     bos_token: "...",
 *     eos_token: "...",
 *     [...]
 *   }
 * }
 */
const convertedTemplate = convertJinjaToGoTemplate(modelInfo.gguf);
if (convertedTemplate) {
  console.log(convertedTemplate.ollama);
  /**
   * {
   *   template: "this is the converted template, compatible with Ollama",
   *   tokens: [... list of special tokens],
   *   params: {
   *     stop: [... list of stop tokens or stop words]
   *   }
   * }
   */
} else {
  console.error("Conversion is not successful");
}
```

## How can I add a custom template?

Most templates will be converted automatically. You can debug the output template using:
- This space to retrieve the converted template: https://huggingface.co/spaces/ngxson/debug_ollama_manifest
- And this space to apply the Go template into a list of messages: https://huggingface.co/spaces/ngxson/ollama_template_test

Please only add a new template only when the conversion above is not successful. Cases that are acceptable to add a custom handler:
- The covnerted template is wrong
- The Jinja template is not compatible with `@huggingface/jinja`
- The Jinja template is not "linear"

To add a new custom handler:
1. Edit the list of `CUSTOM_TEMPLATE_MAPPING` inside `chat-template.ts`
2. Add a new test case in `chat-template.spec.ts`
3. hen push your change into new PR.
