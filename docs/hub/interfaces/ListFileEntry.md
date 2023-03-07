# Interface: ListFileEntry

## Properties

### lastCommit

• **lastCommit**: ``null`` \| { `date`: `string` ; `id`: `string` ; `title`: `string`  }

#### Defined in

[hub/src/lib/list-files.ts:18](https://github.com/huggingface/huggingface.js/blob/main/packages/hub/src/lib/list-files.ts#L18)

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

[hub/src/lib/list-files.ts:12](https://github.com/huggingface/huggingface.js/blob/main/packages/hub/src/lib/list-files.ts#L12)

___

### oid

• **oid**: `string`

#### Defined in

[hub/src/lib/list-files.ts:11](https://github.com/huggingface/huggingface.js/blob/main/packages/hub/src/lib/list-files.ts#L11)

___

### path

• **path**: `string`

#### Defined in

[hub/src/lib/list-files.ts:10](https://github.com/huggingface/huggingface.js/blob/main/packages/hub/src/lib/list-files.ts#L10)

___

### security

• `Optional` **security**: `unknown`

#### Defined in

[hub/src/lib/list-files.ts:23](https://github.com/huggingface/huggingface.js/blob/main/packages/hub/src/lib/list-files.ts#L23)

___

### size

• **size**: `number`

#### Defined in

[hub/src/lib/list-files.ts:9](https://github.com/huggingface/huggingface.js/blob/main/packages/hub/src/lib/list-files.ts#L9)

___

### type

• **type**: ``"file"`` \| ``"directory"`` \| ``"unknown"``

#### Defined in

[hub/src/lib/list-files.ts:8](https://github.com/huggingface/huggingface.js/blob/main/packages/hub/src/lib/list-files.ts#L8)
