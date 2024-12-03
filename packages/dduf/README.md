# 🤗 Hugging Face DDUF

Utilities to convert a string or URL to a [Blob](https://developer.mozilla.org/en-US/docs/Web/API/Blob) object, whether it represents a local file or remote URL.

`fetch` returns a `Blob` object for remote URLs, but it loads the entire file in memory. This utility makes an ad-hoc http range requests when calling `.slice()` on the blob, for example.

## Install

```console
pnpm add @huggingface/dduf

npm add @huggingface/dduf

yarn add @huggingface/dduf
```

### Deno

```ts
// esm.sh
import { checkDDUF } from "https://esm.sh/@huggingface/dduf";
// or npm:
import { checkDDUF } from "npm:@huggingface/dduf";
```

## Usage


```ts
import { checkDDUF } from "@huggingface/dduf";


for await (const entry of checkDDUF(URL | Blob, { log: console.log })) {
  console.log("file", entry);
}
```
