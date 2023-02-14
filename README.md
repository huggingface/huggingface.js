# hub.js

Official utilities to use the Hugging Face hub API

```
npm add @huggingface/hub
```

See also [TimMikeladze/huggingface](https://github.com/TimMikeladze/huggingface) for a non-official wrapper to use the inference API

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
			// or new TextEncoder().encode("Hello World")
			// or Buffer.from("Hello world")
			content: new Blob(["Hello World"]),
		},
	],
});

await deleteRepo({ repo, credentials });
```
