# Interface: ListFileEntry

## Properties

### lastCommit

• **lastCommit**: ``null`` \| { `author`: { `date`: `string`  } ; `id`: `string` ; `subject`: `string`  }

#### Defined in

[src/lib/list-files.ts:17](https://github.com/huggingface/huggingface.js/blob/16bd879/packages/hub/src/lib/list-files.ts#L17)

___

### lfs

• `Optional` **lfs**: `Object`

#### Type declaration

| Name | Type | Description |
| :------ | :------ | :------ |
| `oid` | `string` | - |
| `pointerSize` | `number` | Size of the raw pointer file, 100~200 bytes |
| `size` | `number` | - |

#### Defined in

[src/lib/list-files.ts:11](https://github.com/huggingface/huggingface.js/blob/16bd879/packages/hub/src/lib/list-files.ts#L11)

___

### path

• **path**: `string`

#### Defined in

[src/lib/list-files.ts:10](https://github.com/huggingface/huggingface.js/blob/16bd879/packages/hub/src/lib/list-files.ts#L10)

___

### security

• `Optional` **security**: `unknown`

#### Defined in

[src/lib/list-files.ts:24](https://github.com/huggingface/huggingface.js/blob/16bd879/packages/hub/src/lib/list-files.ts#L24)

___

### size

• **size**: `number`

#### Defined in

[src/lib/list-files.ts:9](https://github.com/huggingface/huggingface.js/blob/16bd879/packages/hub/src/lib/list-files.ts#L9)

___

### type

• **type**: ``"file"`` \| ``"directory"`` \| ``"unknown"``

#### Defined in

[src/lib/list-files.ts:8](https://github.com/huggingface/huggingface.js/blob/16bd879/packages/hub/src/lib/list-files.ts#L8)
