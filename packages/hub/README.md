# 🤗 Hugging Face Hub API

Official utilities to use the Hugging Face Hub API.

## Install

```console
pnpm add @huggingface/hub

npm add @huggingface/hub

yarn add @huggingface/hub
```

### Deno

```ts
// esm.sh
import { uploadFiles, listModels } from "https://esm.sh/@huggingface/hub"
// or npm:
import { uploadFiles, listModels } from "npm:@huggingface/hub"
```

Check out the [full documentation](https://huggingface.co/docs/huggingface.js/hub/README).

## Usage

For some of the calls, you need to create an account and generate an [access token](https://huggingface.co/settings/tokens).

Learn how to find free models using the hub package in this [interactive tutorial](https://scrimba.com/scrim/c7BbVPcd?pl=pkVnrP7uP).

```ts
import * as hub from "@huggingface/hub";
import type { RepoDesignation } from "@huggingface/hub";

const repo: RepoDesignation = { type: "model", name: "myname/some-model" };

const {name: username} = await hub.whoAmI({accessToken: "hf_..."});

for await (const model of hub.listModels({search: {owner: username}, accessToken: "hf_..."})) {
  console.log("My model:", model);
}

const specificModel = await hub.modelInfo({name: "openai-community/gpt2"});
await hub.checkRepoAccess({repo, accessToken: "hf_..."});

await hub.createRepo({ repo, accessToken: "hf_...", license: "mit" });

await hub.uploadFiles({
  repo,
  accessToken: "hf_...",
  files: [
    // path + blob content
    {
      path: "file.txt",
      content: new Blob(["Hello World"]),
    },
    // Local file URL
    pathToFileURL("./pytorch-model.bin"),
    // Web URL
    new URL("https://huggingface.co/xlm-roberta-base/resolve/main/tokenizer.json"),
    // Path + Web URL
    {
      path: "myfile.bin",
      content: new URL("https://huggingface.co/bert-base-uncased/resolve/main/pytorch_model.bin")
    }
    // Can also work with native File in browsers
  ],
});

// or

for await (const progressEvent of await hub.uploadFilesWithProgress({
  repo,
  accessToken: "hf_...",
  files: [
    ...
  ],
})) {
  console.log(progressEvent);
}

await hub.deleteFile({repo, accessToken: "hf_...", path: "myfile.bin"});

await (await hub.downloadFile({ repo, path: "README.md" })).text();

for await (const fileInfo of hub.listFiles({repo})) {
  console.log(fileInfo);
}

await hub.deleteRepo({ repo, accessToken: "hf_..." });
```

## OAuth Login

It's possible to login using OAuth (["Sign in with HF"](https://huggingface.co/docs/hub/oauth)).

This will allow you get an access token to use some of the API, depending on the scopes set inside the Space or the OAuth App.

```ts
import { oauthLoginUrl, oauthHandleRedirectIfPresent } from "@huggingface/hub";

const oauthResult = await oauthHandleRedirectIfPresent();

if (!oauthResult) {
  // If the user is not logged in, redirect to the login page
  window.location.href = await oauthLoginUrl();
}

// You can use oauthResult.accessToken, oauthResult.accessTokenExpiresAt and oauthResult.userInfo
console.log(oauthResult);
```

Checkout the demo: https://huggingface.co/spaces/huggingfacejs/client-side-oauth

## Hugging face cache

The `@huggingface/hub` package provide basic capabilities to scan the cache directory. Learn more about [Manage huggingface_hub cache-system](https://huggingface.co/docs/huggingface_hub/en/guides/manage-cache).

```ts
import { scanCacheDir } from "@huggingface/hub";

const result = await scanCacheDir();

console.log(result);
```
Note that the cache directory is created and used only by the Python and Rust libraries. Downloading files using the `@huggingface/hub` package won't use the cache directory.

## Performance considerations

When uploading large files, you may want to run the `commit` calls inside a worker, to offload the sha256 computations.

Remote resources and local files should be passed as `URL` whenever it's possible so they can be lazy loaded in chunks to reduce RAM usage. Passing a `File` inside the browser's context is fine, because it natively behaves as a `Blob`.

Under the hood, `@huggingface/hub` uses a lazy blob implementation to load the file.

## Dependencies

- `@huggingface/tasks` : Typings only
