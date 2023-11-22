# Templates

A minimalistic JavaScript implementation of the Jinja templating engine, specifically designed for parsing ML chat templates.

## Usage

### Load template from a model on the Hugging Face Hub

First, install the templates and hub packages:
```sh
npm i @huggingface/templates
npm i @huggingface/hub
```

You can then load a tokenizer from the Hugging Face Hub and render a list of chat messages, as follows:

```js
import { Template } from "@huggingface/templates";
import { downloadFile } from "@huggingface/hub";

const config = await (await downloadFile({
    repo: "mistralai/Mistral-7B-Instruct-v0.1",
    path: "tokenizer_config.json"
})).json();

const template = new Template(config.chat_template);

const chat = [
   {"role": "user", "content": "Hello, how are you?"},
   {"role": "assistant", "content": "I'm doing great. How can I help you today?"},
   {"role": "user", "content": "I'd like to show off how chat templating works!"},
];
const result = template.render(chat);
// "<s>[INST] Hello, how are you? [/INST]I'm doing great. How can I help you today?</s> [INST] I'd like to show off how chat templating works! [/INST]"
```

### Transformers.js (coming soon)

First, install the `@huggingface/templates` and `@xenova/transformers` packages:
```sh
npm i @huggingface/templates
npm i @xenova/transformers
```

```js
import { AutoTokenizer } from '@xenova/transformers';

const tokenizer = await AutoTokenizer.from_pretrained("mistralai/Mistral-7B-Instruct-v0.1");

const chat = [
  { "role": "user", "content": "Hello, how are you?" },
  { "role": "assistant", "content": "I'm doing great. How can I help you today?" },
  { "role": "user", "content": "I'd like to show off how chat templating works!" },
]

const text = tokenizer.apply_chat_template(chat, { tokenize: false });
// "<s>[INST] Hello, how are you? [/INST]I'm doing great. How can I help you today?</s> [INST] I'd like to show off how chat templating works! [/INST]"

const input_ids = tokenizer.apply_chat_template(chat, { tokenize: true, return_tensor: false });
// [1, 733, 16289, 28793, 22557, 28725, 910, 460, 368, 28804, 733, 28748, 16289, 28793, 28737, 28742, 28719, 2548, 1598, 28723, 1602, 541, 315, 1316, 368, 3154, 28804, 2, 28705, 733, 16289, 28793, 315, 28742, 28715, 737, 298, 1347, 805, 910, 10706, 5752, 1077, 3791, 28808, 733, 28748, 16289, 28793]
```

