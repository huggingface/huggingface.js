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

Also, use `Blob` to avoid loading the whole files in RAM. In `Node`, it's up to you to provide a smart `Blob` wrapper around your file. Feel free to open an issue if you want *us* to provide the smart `Blob` implementation. If you use `Bun`, `Bun.File` is already a smart blob implementation and can be used directly!

## Dependencies

- `hash-wasm` : Only used in the browser, when committing files over 10 MB. Browsers do not natively support streaming sha256 computations.
- `type-fest` : Typings only