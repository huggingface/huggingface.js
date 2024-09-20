# What does this PR do?

This PR adds support for the library [TO BE COMPLETED].

Link to library repo: [TO BE COMPLETED].

Link to models on the Hub: https://huggingface.co/models?other=[to-be-completed].

## Main instructions

Please check that all prerequisites are met.

- [ ] A new library has been added to [model-libraries.ts](https://github.com/huggingface/huggingface.js/blob/main/packages/tasks/src/model-libraries.ts#L60).
- [ ] The alphabetical order of `MODEL_LIBRARIES_UI_ELEMENTS` has been preserved.
- [ ] The library id is lowercased and hyphen-separated (example: `"adapter-transformers"`).
- [ ] At least one model is referenced on https://huggingface.co/models?other=my-library-name. If not, the model card metadata of the relevant models must be updated to add `library_name: my-library-name` (see [example](https://huggingface.co/google/gemma-scope/blob/main/README.md?code=true#L3)). If you are not the owner of the models on the Hub, please open PRs (see [example](https://huggingface.co/MCG-NJU/VFIMamba/discussions/1)). **Note:** if no models are listed, this PR won't be merged.
- [ ] `repoName` and `prettyLabel` are set with user-friendly casing (example: `DeepForest`).
- [ ] `repoUrl` is set with a link to the library source code (usually a GitHub repository).
- [ ] (optional) `docsUrl` is set with a link to the docs of the library. If the documentation is in the GitHub repo referenced above, no need to set it twice.
- [ ] `filter` is set to `false`.
- [ ] `countDownload` follows the correct convention and do not duplicate the counting. For instance, if loading a model requires 3 files, the download count rule must count downloads only on 1 of the 3 files. Otherwise, the download count will be overestimated. If the library uses one of the default config files (`config.json`, `config.yaml`, `hyperparams.yaml`, and `meta.yaml`, see [here](https://huggingface.co/docs/hub/models-download-stats#which-are-the-query-files-for-different-libraries)), there is no need to manually define a download count rule.
- [ ] (optional) `snippets` is correctly defined. See check-list below.
- [ ] Make sure that the code passes the linter test as well

## (optional) Snippets instructions

Adding a code snippet helps users to start using your library. It is especially useful when the library is tightly integrated with the Hub and typically has a `Model.from_pretrained` helper method. Check out [this guide](https://huggingface.co/docs/huggingface_hub/guides/download) to learn how to download files in Python and [this guide](https://huggingface.co/docs/huggingface_hub/guides/integrations) for a broader explanation on how to integrate a library with the Hub. Note that adding a code snippet is optional.
For code snippets specifically, please refer to this checklist:

- [ ] Code snippet has been defined in [model-libraries-snippets.ts](https://github.com/huggingface/huggingface.js/blob/main/packages/tasks/src/model-libraries-snippets.ts) and added to [model-libraries.ts](https://github.com/huggingface/huggingface.js/blob/main/packages/tasks/src/model-libraries.ts#L60).
- [ ] Code snippet does not contain installation instruction.
- [ ] Code snippet is minimal (only loading / calling the model with simple config).
- [ ] (recommended) Code snippet is generated from `ModelData`, typically to get the correct command to load a specific model.
- [ ] (optional) It's possible to define multiple code snippets (by returning a list) to showcase different usage.
