# Huggingface Widgets

**Note: this package is no longer maintained.**

Open-source version of the inference widgets from huggingface.co

> Built with Svelte and SvelteKit

**Demo page:** https://huggingface.co/spaces/huggingfacejs/inference-widgets

## Publishing

Because `@huggingface/widgets` depends on `@huggingface/tasks`, you need to publish `@huggingface/tasks` first, and then `@huggingface/widgets`. There should be a CI check to prevent publishing `@huggingface/widgets` if `@huggingface/tasks` hasn't been published yet.

## Demo

You can run the demo locally:

```console
pnpm install
pnpm dev --open
```

If you are submitting a PR, make sure that you run `format` & `lint` before submitting the PR:

```console
pnpm format
pnpm lint
```

If you want to try the "Sign-in with HF" feature locally, you will need to https://huggingface.co/settings/applications/new an OAuth application with `"openid"`, `"profile"` and `"inference-api"` scopes and `http://localhost:5173/auth/callback/huggingface` as the redirect URL.

Then you can create a `.env.local` file with the following content:

```env
OAUTH_CLIENT_ID=...
OAUTH_CLIENT_SECRET=...
```

If you want to try the "Sign-in with HF" feature in a Space, you can just duplicate https://huggingface.co/spaces/huggingfacejs/inference-widgets, it should work out of the box thanks to the metadata in the `README.md` file.

## Testing for moon (for huggingface admins)

```console
pnpm i
pnpm build
```

And then inside moon, run the following command for both `server` & `front`:

```console
npm i --save @huggingface/widgets@<relative path to huggingface.js/packages/widgets>
```
