# 🤗 Hugging Face Space Header

A Typescript powered wrapper for the Space `mini_header` feature.

![space header preview](https://huggingface.co/datasets/huggingface/documentation-images/resolve/main/space-header-package/thumbnail.png)

## Install

```console
pnpm add @huggingface/space-header

npm add @huggingface/space-header

yarn add @huggingface/space-header
```

### Deno

```ts
// esm.sh
import { init } from "https://esm.sh/@huggingface/space-header"
// or npm:
import { init } from "npm:@huggingface/space-header"
```

### Initialize
```ts
import { init } from "@huggingface/space-header";

// ...

init(":user/:spaceId");
// init("enzostvs/lora-studio") for example
```
❗Important note: The `init` method must be called on the client side.

## Usage

Uses the `target` option to inject the space-header into another DOM element

```ts
const app = document.getElementById("app");

// ...

init(":user/:spaceId", {
  target: app
});
```

If you already have the space data, you can also pass it as a parameter to avoid a fetch

```ts
init(space);

// space = {
//  id: string;
//  likes: number;
//  author: string;
// }
```
