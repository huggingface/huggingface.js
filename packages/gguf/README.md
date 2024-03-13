# `@huggingface/gguf`

A GGUF parser that works on remotely hosted files.

## Spec

https://github.com/ggerganov/ggml/blob/master/docs/gguf.md

Reference implementation (Python): https://github.com/ggerganov/llama.cpp/blob/master/gguf-py/gguf/gguf_reader.py

## Install

```bash
npm install @huggingface/gguf
```

## Usage

```ts
// remote GGUF file from https://huggingface.co/TheBloke/Llama-2-7B-Chat-GGUF
const URL_LLAMA = "https://huggingface.co/TheBloke/Llama-2-7B-Chat-GGUF/resolve/191239b/llama-2-7b-chat.Q2_K.gguf";

const { metadata, tensorInfos } = await gguf(URL_LLAMA);

console.log(metadata);
// {
//     version: 2,
//     tensor_count: 291n,
//     kv_count: 19n,
//     "general.architecture": "llama",
//     "general.file_type": 10,
//     "general.name": "LLaMA v2",
//     ...
// }

console.log(tensorInfos);
// [
//     {
//         name: "token_embd.weight",
//         shape: [4096n, 32000n],
//         dtype: GGMLQuantizationType.Q2_K,
//     },

//     ... ,

//     {
//         name: "output_norm.weight",
//         shape: [4096n],
//         dtype: GGMLQuantizationType.F32,
//     }
// ]

```

## Acknowledgements & Inspirations

- https://github.com/hyparam/hyllama by @platypii (MIT license)
- https://github.com/ahoylabs/gguf.js by @biw @dkogut1996 @spencekim (MIT license)

🔥❤️

