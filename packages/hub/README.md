# 🤗 Hugging Face Hub API

Official utilities to use the Hugging Face hub API, still very experimental.

```
npm add @huggingface/hub
```

Check out the [full documentation](https://huggingface.co/docs/huggingface.js/hub/README).

## Usage

For some of the calls, you need to create an account and generate an [access token](https://huggingface.co/settings/tokens).

```ts
import { createRepo, commit, deleteRepo, listFiles, whoAmI } from "@huggingface/hub";
import type { RepoId, Credentials } from "@huggingface/hub";

const repo: RepoId = { type: "model", name: "myname/some-model" };
const credentials: Credentials = { accessToken: "hf_..." };

const {name: username} = await whoAmI({credentials});

for await (const model of listModels({search: {owner: username}, credentials})) {
  console.log("My model:", model);
}

await createRepo({ repo, credentials, license: "mit" });

await commit({
  repo,
  credentials,
  operations: [
    {
      operation: "addOrUpdate",
      path: "file.txt",
      content: new Blob(["Hello World"]),
    },
    {
      operation: "addOrUpdate",
      path: "pytorch-model.bin",
      // Only supported from the backend
      content: pathToFileURL("./pytorch-model.bin"),
    },
    {
      operation: "addOrUpdate",
      path: "tokenizer.json",
      // Copy xml-roberta-base's tokenizer.json directly from HF
      content: new URL("https://huggingface.co/xlm-roberta-base/raw/main/tokenizer.json"),
    },
  ],
});

await (await downloadFile({ repo, path: "README.md" })).text();

for await (const fileInfo of listFiles({repo})) {
  console.log(fileInfo);
}

await deleteRepo({ repo, credentials });
```

## Performance considerations

When uploading large files, you may want to run the `commit` calls inside a worker, to offload the sha256 computations.

Remote resources and local files should be passed as `URL` whenever it's possible so they can be lazy loaded in chunks to reduce RAM usage. Passing a `File` inside the browser's context is fine, because it natively behaves as a `Blob`.

Under the hood, `@huggingface/hub` uses a lazy blob implementation to load the file.

## Dependencies

- `hash-wasm` : Only used in the browser, when committing files over 10 MB. Browsers do not natively support streaming sha256 computations.
- `type-fest` : Typings only