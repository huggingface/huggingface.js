# Internal package for doc generation

This package generates `.md` files inside the [docs](../../docs) folder using [typedoc](https://typedoc.org/) and [typedoc-plugin-markdown](https://github.com/tgreyuk/typedoc-plugin-markdown).

The `.md` files are generated when releasing packages. They are then published to [hugginface.co](https://huggingface.co/docs/huggingface.js/index) through the [doc-builder](https://github.com/huggingface/doc-builder)'s github action.

We run a few scripts in between, [fix-md-links](./fix-md-links.ts) and [update-toc](./update-toc.ts) to preprocess the files for `doc-builder`.

## Commands

```console
# Generate all docs
npm run start

# Generate docs for @huggingface/hub
npm run prepublish-hub

# Generate docs for @huggingface/inference
npm run prepublish-inference
```

## HTML docs

If you want to see the final HTML docs, there are a few steps:

- Generate the docs with `npm run start`
- Clone https://github.com/huggingface/doc-builder and put it in the same folder as huggingface.js
- Follow the instructions to install it from source
- Go in its `kit` folder and run `npm install`

Then:

```console
# Inside the doc-builder folder
doc-builder preview huggingface.js ../huggingface.js/docs --not_python_module
```