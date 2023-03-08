Hello! Thank you for reading this file, we're eager for contributions.

## PNPM

We use `pnpm` as our package manager. You need to use it, eg `pnpm install` instead of `npm install`.

## Code style

If you want to format the whole codebase, you can do `pnpm -r format` at the root.

Otherwise, we avoid runtime dependencies unless they're strictly needed. For example, our only dependency is `hash-wasm`, and it's only in the browser context and when uploaded files are > 10MB.

## Pull requests

Keep your changes scoped to the subject of the PR!
