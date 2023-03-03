# Interface: CommitParams

## Properties

### branch

• `Optional` **branch**: `string`

**`Default`**

"main"

#### Defined in

[hub/src/lib/commit.ts:51](https://github.com/huggingface/huggingface.js/blob/main/packages/hub/src/lib/commit.ts#L51)

___

### credentials

• **credentials**: [`Credentials`](Credentials)

#### Defined in

[hub/src/lib/commit.ts:49](https://github.com/huggingface/huggingface.js/blob/main/packages/hub/src/lib/commit.ts#L49)

___

### description

• `Optional` **description**: `string`

#### Defined in

[hub/src/lib/commit.ts:46](https://github.com/huggingface/huggingface.js/blob/main/packages/hub/src/lib/commit.ts#L46)

___

### hubUrl

• `Optional` **hubUrl**: `string`

#### Defined in

[hub/src/lib/commit.ts:60](https://github.com/huggingface/huggingface.js/blob/main/packages/hub/src/lib/commit.ts#L60)

___

### isPullRequest

• `Optional` **isPullRequest**: `boolean`

#### Defined in

[hub/src/lib/commit.ts:59](https://github.com/huggingface/huggingface.js/blob/main/packages/hub/src/lib/commit.ts#L59)

___

### operations

• **operations**: [`CommitOperation`](../modules#commitoperation)[]

#### Defined in

[hub/src/lib/commit.ts:48](https://github.com/huggingface/huggingface.js/blob/main/packages/hub/src/lib/commit.ts#L48)

___

### parentCommit

• `Optional` **parentCommit**: `string`

Parent commit. Optional

- When opening a PR: will use parentCommit as the parent commit
- When committing on a branch: Will make sure that there were no intermediate commits

#### Defined in

[hub/src/lib/commit.ts:58](https://github.com/huggingface/huggingface.js/blob/main/packages/hub/src/lib/commit.ts#L58)

___

### repo

• **repo**: [`RepoId`](RepoId)

#### Defined in

[hub/src/lib/commit.ts:47](https://github.com/huggingface/huggingface.js/blob/main/packages/hub/src/lib/commit.ts#L47)

___

### title

• **title**: `string`

#### Defined in

[hub/src/lib/commit.ts:45](https://github.com/huggingface/huggingface.js/blob/main/packages/hub/src/lib/commit.ts#L45)
