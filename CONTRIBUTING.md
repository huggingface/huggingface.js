Hello! Thank you for reading this file, we're eager for contributions.

## PNPM

We use `pnpm` as our package manager. You need to use it, eg `pnpm install` instead of `npm install`.

## Code style

If you want to format the whole codebase, you can do `pnpm -r format` at the root.

Other than that, we avoid runtime dependencies unless they're strictly needed. Even then, we prefer vendoring the code.

## Pull requests

Keep your changes scoped to the subject of the PR!

It's not a hard requirement, but please consider using an icon from [Gitmoji](https://gitmoji.dev/) as a prefix to your PR title.

## Tests

If you want to run only specific tests, you can do `pnpm test -- -t "test name"`.

You can also do `pnpm --filter hub test ./src/utils/XetBlob.spec.ts` to run a specific test file.

## Adding a package

- Add the package name in [`pnpm-workspace.yaml`](pnpm-workspace.yaml)
- Add a `package.json` inspired from the other packages ([`packages/hub/package.json`](packages/hub/package.json) / [`packages/agents/package.json`](packages/agents/package.json)) in `packages/<package name>/package.json`
- Run `pnpm install` at the root
- Edit [`packages/doc-internal/package.json`](packages/doc-internal/package.json) and add the command in the `scripts` section:
  - `doc-<package name>` (don't forget to edit the `start` command too)
- Add the `<package-name>-publish.yml` file in the `.github/workflows` folder, inspired from the other packages
- Add the package in the main README.md
- Add a `tsup.config.ts` file in the package folder, inspired from the other packages, or just use `tsup src/index.ts --format cjs,esm --clean && tsc --emitDeclarationOnly --declaration` as the build command
- Copy `.prettierignore` from another package
- Add a `tsconfig.json`
