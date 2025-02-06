# 🤗 Hugging Face DDUF

Very alpha version of a DDUF checker / parser.

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
