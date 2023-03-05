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