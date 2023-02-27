# @huggingface/hub

🚧 Experimental, the module is being built, API will break! 🚧

Official utilities to use the Hugging Face hub API

```
npm add @huggingface/hub
```

## API

```ts
import { createRepo, createCommit, deleteRepo } from "@huggingface/hub";
import type { RepoId, Credentials } from "@huggingface/hub";

const repo: RepoId = { type: "model", name: "myname/some-model" };
const credentials: Credentials = { accessToken: "hf_..." };

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

// No need for credentials to download public files
await (await downloadFile({ repo, path: "README.md" })).text();

await deleteRepo({ repo, credentials });
```

## Performance considerations

When uploading large files, you may want to run the `commit` calls inside a worker, to offload the sha256 computations.

Also, use `Blob` to avoid loading the whole files in RAM. In `Node`, it's up to you to provide a smart `Blob` wrapper around your file. Feel free to open an issue if you want *us* to provide the smart `Blob` implementation.

## Dependencies

- `hash-wasm` : Only used in the browser, when committing files over 10 MB. Browsers do not natively support streaming sha256 computations.