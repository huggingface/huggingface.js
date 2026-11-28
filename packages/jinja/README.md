# Jinja

A minimalistic JavaScript implementation of the Jinja templating engine, specifically designed for parsing and rendering ML chat templates.

## Usage

### Load template from a model on the Hugging Face Hub

First, install the jinja and hub packages:

```sh
npm i @huggingface/jinja
npm i @huggingface/hub
```

You can then load a tokenizer from the Hugging Face Hub and render a list of chat messages, as follows:

```js
import { Template } from "@huggingface/jinja";
import { downloadFile } from "@huggingface/hub";

const config = await (
	await downloadFile({
		repo: "mistralai/Mistral-7B-Instruct-v0.1",
		path: "tokenizer_config.json",
	})
).json();

const chat = [
	{ role: "user", content: "Hello, how are you?" },
	{ role: "assistant", content: "I'm doing great. How can I help you today?" },
	{ role: "user", content: "I'd like to show off how chat templating works!" },
];

const template = new Template(config.chat_template);
const result = template.render({
	messages: chat,
	bos_token: config.bos_token,
	eos_token: config.eos_token,
});
// "<s>[INST] Hello, how are you? [/INST]I'm doing great. How can I help you today?</s> [INST] I'd like to show off how chat templating works! [/INST]"
```

### Transformers.js

First, install `@huggingface/transformers`:

```sh
npm i @huggingface/transformers
```

You can then render a list of chat messages using a tokenizer's `apply_chat_template` method.

```js
import { AutoTokenizer } from "@huggingface/transformers";

// Load tokenizer from the Hugging Face Hub
const tokenizer = await AutoTokenizer.from_pretrained("mistralai/Mistral-7B-Instruct-v0.1");

// Define chat messages
const chat = [
	{ role: "user", content: "Hello, how are you?" },
	{ role: "assistant", content: "I'm doing great. How can I help you today?" },
	{ role: "user", content: "I'd like to show off how chat templating works!" },
];

const text = tokenizer.apply_chat_template(chat, { tokenize: false });
// "<s>[INST] Hello, how are you? [/INST]I'm doing great. How can I help you today?</s> [INST] I'd like to show off how chat templating works! [/INST]"
```

Notice how the entire chat is condensed into a single string. If you would instead like to return the tokenized version (i.e., a list of token IDs), you can use the following:

```js
const input_ids = tokenizer.apply_chat_template(chat, { tokenize: true, return_tensor: false });
// [1, 733, 16289, 28793, 22557, 28725, 910, 460, 368, 28804, 733, 28748, 16289, 28793, 28737, 28742, 28719, 2548, 1598, 28723, 1602, 541, 315, 1316, 368, 3154, 28804, 2, 28705, 733, 16289, 28793, 315, 28742, 28715, 737, 298, 1347, 805, 910, 10706, 5752, 1077, 3791, 28808, 733, 28748, 16289, 28793]
```

### User-defined filters

A filter name that the built-in filters do not know is looked up in the environment, so a function
passed to `render`, bound with `{% set %}`, or declared as a `{% macro %}` can be used as a filter. It
is called with the operand as its first argument, followed by the filter arguments.

```js
const template = new Template("{{ name | shout }}{{ name | wrap('[', ']') }}");
const result = template.render({
	name: "hi",
	shout: (value) => value.toUpperCase(),
	wrap: (value, left, right) => left + value + right,
});
// "HI[hi]"
```

Because the lookup goes through the environment, it is the same one `{{ shout(x) }}` uses: anything the
template can call by name can also be used as a filter. The global functions (`range`, `strftime_now`,
...) work as filters too:

```js
new Template('{{ fmt | strftime_now }}').render({ fmt: "%Y" }); // the current year
```

The function is called the way any other function coming from the environment is: its arguments arrive
converted to JavaScript (strings and numbers as-is, an array as an array of runtime values, an object as a
`Map`), keyword arguments arrive as an extra `Map` at the end, and the return value is converted back:

```js
new Template("{{ xs | csv }}").render({
	xs: ["a", "b"],
	csv: (value) => value.map((x) => x.value).join(","), // the elements are runtime values
});
// "a,b"
```

A built-in filter keeps its meaning, unless you opt in to letting a function of the same name replace
one (`allowFilterOverride`, off by default). Only functions can replace a filter:

```js
const template = new Template("{{ name | upper }}", { allowFilterOverride: true });
template.render({ name: "hi", upper: (value) => `[${value}]` }); // "[hi]"
template.render({ name: "hi", upper: "not a function" }); // "HI"
```

A replacement takes over the name for every operand type, and has to interpret the arguments the template
passes itself: `{{ x | tojson(indent=2) }}` hands it a `Map` holding `indent`, not a second parameter. Only
opt in for templates you control, since render data such as `{ items: fn }` then applies to every
`| items` of the template.

For more information about chat templates, check out the transformers [documentation](https://huggingface.co/docs/transformers/main/en/chat_templating).
