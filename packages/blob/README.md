# 🤗 Hugging Face Blobs

Utilities to convert a string or URL to a [Blob](https://developer.mozilla.org/en-US/docs/Web/API/Blob) object, whether it represents a local file or remote URL.

`fetch` already returns a `Blob` object for remote URLs, but it loads the entire file in memory. This utility makes ad-hoc http range requests when calling `.slice()` on the blob, for example.

## Install

```console
pnpm add @huggingface/blob

npm add @huggingface/blob

yarn add @huggingface/blob
```

### Deno

```ts
// esm.sh
import { FileBlob, WebBlob } from "https://esm.sh/@huggingface/blob";
// or npm:
import { FileBlob, WebBlob } from "npm:@huggingface/blob";
```

## Usage


```ts
import { FileBlob } from "@huggingface/blob/FileBlob";
import { WebBlob } from "@huggingface/blob/WebBlob";
import { createBlob } from "@huggingface/blob";

const fileBlob = await FileBlob.create("path/to/file");
const webBlob = await WebBlob.create("https://url/to/file");

const blob = await createBlob("..."); // Automatically detects if it's a file or web URL
```

## API

### createBlob

Creates a Blob object from a string or URL. Automatically detects if it's a file or web URL.

```ts
await createBlob("...", {
  /**
   * Custom fetch function to use, in case it resolves to a Web Blob.
   * 
   * Useful for adding headers, etc.
   */
  fetch: ...,
});

### FileBlob

```ts
await FileBlob.create("path/to/file");
await FileBlob.create(new URL("file:///path/to/file"));
```

### WebBlob

Creates a Blob object from a URL. If the file is less than 1MB (as indicated by the Content-Length header), by default it will be cached in memory in entirety upon blob creation.

This class is useful for large files that do not need to be loaded all at once in memory, as it makes range requests for the data.

```ts
await WebBlob.create("https://url/to/file");
await WebBlob.create(new URL("https://url/to/file"));

await WebBlob.create("https://url/to/file", {
  /**
   * Custom fetch function to use. Useful for adding headers, etc.
   */
  fetch: ...,
  /**
   * If the file is less than the specified size, it will be cached in memory in entirety upon blob creation,
   * instead of doing range requests for the data.
   * 
   * @default 1_000_000
   */
  cacheBelow: ...
})
```