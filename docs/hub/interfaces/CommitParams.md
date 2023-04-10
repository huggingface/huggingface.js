# Interface: CommitParams

## Properties

### branch

• `Optional` **branch**: `string`

**`Default`**

"main"

#### Defined in

[hub/src/lib/commit.ts:62](https://github.com/huggingface/huggingface.js/blob/main/packages/hub/src/lib/commit.ts#L62)

___

### credentials

• **credentials**: [`Credentials`](Credentials)

#### Defined in

[hub/src/lib/commit.ts:60](https://github.com/huggingface/huggingface.js/blob/main/packages/hub/src/lib/commit.ts#L60)

___

### description

• `Optional` **description**: `string`

#### Defined in

[hub/src/lib/commit.ts:57](https://github.com/huggingface/huggingface.js/blob/main/packages/hub/src/lib/commit.ts#L57)

___

### hubUrl

• `Optional` **hubUrl**: `string`

#### Defined in

[hub/src/lib/commit.ts:71](https://github.com/huggingface/huggingface.js/blob/main/packages/hub/src/lib/commit.ts#L71)

___

### isPullRequest

• `Optional` **isPullRequest**: `boolean`

#### Defined in

[hub/src/lib/commit.ts:70](https://github.com/huggingface/huggingface.js/blob/main/packages/hub/src/lib/commit.ts#L70)

___

### operations

• **operations**: [`CommitOperation`](../modules#commitoperation)[]

#### Defined in

[hub/src/lib/commit.ts:59](https://github.com/huggingface/huggingface.js/blob/main/packages/hub/src/lib/commit.ts#L59)

___

### parentCommit

• `Optional` **parentCommit**: `string`

Parent commit. Optional

- When opening a PR: will use parentCommit as the parent commit
- When committing on a branch: Will make sure that there were no intermediate commits

#### Defined in

[hub/src/lib/commit.ts:69](https://github.com/huggingface/huggingface.js/blob/main/packages/hub/src/lib/commit.ts#L69)

___

### repo

• **repo**: [`RepoDesignation`](../modules#repodesignation)

#### Defined in

[hub/src/lib/commit.ts:58](https://github.com/huggingface/huggingface.js/blob/main/packages/hub/src/lib/commit.ts#L58)

___

### title

• **title**: `string`

#### Defined in

[hub/src/lib/commit.ts:56](https://github.com/huggingface/huggingface.js/blob/main/packages/hub/src/lib/commit.ts#L56)
