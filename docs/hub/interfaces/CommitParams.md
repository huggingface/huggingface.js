# Interface: CommitParams

## Properties

### branch

• `Optional` **branch**: `string`

**`Default`**

"main"

#### Defined in

[hub/src/lib/commit.ts:61](https://github.com/huggingface/huggingface.js/blob/main/packages/hub/src/lib/commit.ts#L61)

___

### credentials

• **credentials**: [`Credentials`](Credentials)

#### Defined in

[hub/src/lib/commit.ts:59](https://github.com/huggingface/huggingface.js/blob/main/packages/hub/src/lib/commit.ts#L59)

___

### description

• `Optional` **description**: `string`

#### Defined in

[hub/src/lib/commit.ts:56](https://github.com/huggingface/huggingface.js/blob/main/packages/hub/src/lib/commit.ts#L56)

___

### hubUrl

• `Optional` **hubUrl**: `string`

#### Defined in

[hub/src/lib/commit.ts:70](https://github.com/huggingface/huggingface.js/blob/main/packages/hub/src/lib/commit.ts#L70)

___

### isPullRequest

• `Optional` **isPullRequest**: `boolean`

#### Defined in

[hub/src/lib/commit.ts:69](https://github.com/huggingface/huggingface.js/blob/main/packages/hub/src/lib/commit.ts#L69)

___

### operations

• **operations**: [`CommitOperation`](../modules#commitoperation)[]

#### Defined in

[hub/src/lib/commit.ts:58](https://github.com/huggingface/huggingface.js/blob/main/packages/hub/src/lib/commit.ts#L58)

___

### parentCommit

• `Optional` **parentCommit**: `string`

Parent commit. Optional

- When opening a PR: will use parentCommit as the parent commit
- When committing on a branch: Will make sure that there were no intermediate commits

#### Defined in

[hub/src/lib/commit.ts:68](https://github.com/huggingface/huggingface.js/blob/main/packages/hub/src/lib/commit.ts#L68)

___

### repo

• **repo**: [`RepoId`](RepoId)

#### Defined in

[hub/src/lib/commit.ts:57](https://github.com/huggingface/huggingface.js/blob/main/packages/hub/src/lib/commit.ts#L57)

___

### title

• **title**: `string`

#### Defined in

[hub/src/lib/commit.ts:55](https://github.com/huggingface/huggingface.js/blob/main/packages/hub/src/lib/commit.ts#L55)
