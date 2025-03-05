## @huggingface.js/tasks-gen

This package is not a published one. It contains scripts that generate or test parts of the `@huggingface.js/tasks` package.

### generate-snippets-fixtures.ts

This script generates and tests Inference API snippets. The goal is to have a simple way to review changes in the snippets.
When updating logic in `packages/tasks/src/snippets`, the test snippets must be updated and committed in the same PR.

To (re-)generate the snippets, run:

```
pnpm generate-snippets-fixtures
```

If some logic has been updated, you should see the result with a

```
git diff
# the diff has to be committed if correct
```

To test the snippets, run:

```
pnpm test
```

Finally if you want to add a test case, you must add an entry in `TEST_CASES` array in `generate-snippets-fixtures.ts`.

### inference-codegen.ts

Generates JS and Python dataclasses based on the Inference Specs (jsonschema files).

This script is run by a cron job once a day and helps getting `@huggingface.js/tasks` and `huggingface_hub` up to date.

To update the specs manually, run:

```
pnpm inference-codegen
```

### inference-tei-import.ts

Fetches TEI specs and generates JSON schema for input and output of text-embeddings (also called feature-extraction).
See https://huggingface.github.io/text-embeddings-inference/ for more details.

This script is run by a cron job once a day and helps getting `@huggingface.js/tasks` up to date with TEI updates.

To update the specs manually, run:

```
pnpm inference-tei-import
```

### inference-tgi-import.ts

Fetches TGI specs and generates JSON schema for input, output and stream_output of text-generation and chat-completion tasks.
See https://huggingface.github.io/text-generation-inference/ for more details.

This script is run by a cron job once a day and helps getting `@huggingface.js/tasks` up to date with TGI updates.

To update the specs manually, run:

```
pnpm inference-tgi-import
```
