# `@huggingface/gguf`

A GGUF parser that works on remotely hosted files.

## Spec

<img src="https://huggingface.co/datasets/huggingface/documentation-images/resolve/main/hub/gguf-spec.png"/>

Spec: https://github.com/ggerganov/ggml/blob/master/docs/gguf.md

Reference implementation (Python): https://github.com/ggerganov/llama.cpp/blob/master/gguf-py/gguf/gguf_reader.py

## Install

```bash
npm install @huggingface/gguf
```

## Usage

### Basic usage

```ts
import { GGMLQuantizationType, gguf } from "@huggingface/gguf";

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

### Reading a local file

```ts
// Reading a local file. (Not supported on browser)
const { metadata, tensorInfos } = await gguf(
  './my_model.gguf',
  { allowLocalFile: true },
);
```

### Strictly typed

By default, known fields in `metadata` are typed. This includes various fields found in [llama.cpp](https://github.com/ggerganov/llama.cpp), [whisper.cpp](https://github.com/ggerganov/whisper.cpp) and [ggml](https://github.com/ggerganov/ggml).

```ts
const { metadata, tensorInfos } = await gguf(URL_MODEL);

// Type check for model architecture at runtime
if (metadata["general.architecture"] === "llama") {

  // "llama.attention.head_count" is a valid key for llama architecture, this is typed as a number
  console.log(model["llama.attention.head_count"]);

  // "mamba.ssm.conv_kernel" is an invalid key, because it requires model architecture to be mamba
  console.log(model["mamba.ssm.conv_kernel"]); // error
}
```

### Disable strictly typed

Because GGUF format can be used to store tensors, we can technically use it for other usages. For example, storing [control vectors](https://github.com/ggerganov/llama.cpp/pull/5970), [lora weights](https://github.com/ggerganov/llama.cpp/pull/2632), etc.

In case you want to use your own GGUF metadata structure, you can disable strict typing by casting the parse output to `GGUFParseOutput<{ strict: false }>`:

```ts
const { metadata, tensorInfos }: GGUFParseOutput<{ strict: false }> = await gguf(URL_LLAMA);
```

## Hugging Face Hub

The Hub supports all file formats and has built-in features for GGUF format. 

Find more information at: http://hf.co/docs/hub/gguf.

## Acknowledgements & Inspirations

- https://github.com/hyparam/hyllama by @platypii (MIT license)
- https://github.com/ahoylabs/gguf.js by @biw @dkogut1996 @spencekim (MIT license)

🔥❤️

