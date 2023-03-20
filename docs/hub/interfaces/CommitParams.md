# Interface: CommitParams

## Properties

### branch

• `Optional` **branch**: `string`

**`Default`**

"main"

#### Defined in

[hub/src/lib/commit.ts:56](https://github.com/huggingface/huggingface.js/blob/main/packages/hub/src/lib/commit.ts#L56)

___

### credentials

• **credentials**: [`Credentials`](Credentials)

#### Defined in

[hub/src/lib/commit.ts:54](https://github.com/huggingface/huggingface.js/blob/main/packages/hub/src/lib/commit.ts#L54)

___

### description

• `Optional` **description**: `string`

#### Defined in

[hub/src/lib/commit.ts:51](https://github.com/huggingface/huggingface.js/blob/main/packages/hub/src/lib/commit.ts#L51)

___

### hubUrl

• `Optional` **hubUrl**: `string`

#### Defined in

[hub/src/lib/commit.ts:65](https://github.com/huggingface/huggingface.js/blob/main/packages/hub/src/lib/commit.ts#L65)

___

### isPullRequest

• `Optional` **isPullRequest**: `boolean`

#### Defined in

[hub/src/lib/commit.ts:64](https://github.com/huggingface/huggingface.js/blob/main/packages/hub/src/lib/commit.ts#L64)

___

### operations

• **operations**: [`CommitOperation`](../modules#commitoperation)[]

#### Defined in

[hub/src/lib/commit.ts:53](https://github.com/huggingface/huggingface.js/blob/main/packages/hub/src/lib/commit.ts#L53)

___

### parentCommit

• `Optional` **parentCommit**: `string`

Parent commit. Optional

- When opening a PR: will use parentCommit as the parent commit
- When committing on a branch: Will make sure that there were no intermediate commits

#### Defined in

[hub/src/lib/commit.ts:63](https://github.com/huggingface/huggingface.js/blob/main/packages/hub/src/lib/commit.ts#L63)

___

### repo

• **repo**: [`RepoId`](RepoId)

#### Defined in

[hub/src/lib/commit.ts:52](https://github.com/huggingface/huggingface.js/blob/main/packages/hub/src/lib/commit.ts#L52)

___

### title

• **title**: `string`

#### Defined in

[hub/src/lib/commit.ts:50](https://github.com/huggingface/huggingface.js/blob/main/packages/hub/src/lib/commit.ts#L50)
