# @huggingface/hub

## Interfaces

- [CommitDeletedEntry](interfaces/CommitDeletedEntry.md)
- [CommitFile](interfaces/CommitFile.md)
- [CommitOutput](interfaces/CommitOutput.md)
- [CommitParams](interfaces/CommitParams.md)
- [Credentials](interfaces/Credentials.md)
- [FileDownloadInfoOutput](interfaces/FileDownloadInfoOutput.md)
- [ListFileEntry](interfaces/ListFileEntry.md)
- [RepoId](interfaces/RepoId.md)

## Type Aliases

### AccessToken

Ƭ **AccessToken**: \`hf\_${string}\`

#### Defined in

[src/types/repo.d.ts:8](https://github.com/huggingface/huggingface.js/blob/f282646/packages/hub/src/types/repo.d.ts#L8)

___

### CommitOperation

Ƭ **CommitOperation**: [`CommitDeletedEntry`](interfaces/CommitDeletedEntry.md) \| [`CommitFile`](interfaces/CommitFile.md)

#### Defined in

[src/lib/commit.ts:42](https://github.com/huggingface/huggingface.js/blob/f282646/packages/hub/src/lib/commit.ts#L42)

___

### RepoType

Ƭ **RepoType**: ``"space"`` \| ``"dataset"`` \| ``"model"``

#### Defined in

[src/types/repo.d.ts:1](https://github.com/huggingface/huggingface.js/blob/f282646/packages/hub/src/types/repo.d.ts#L1)

___

### SpaceHardwareFlavor

Ƭ **SpaceHardwareFlavor**: ``"cpu-basic"`` \| ``"cpu-upgrade"`` \| ``"t4-small"`` \| ``"t4-medium"`` \| ``"a10g-small"`` \| ``"a10g-large"`` \| ``"a100-large"``

#### Defined in

[src/types/repo.d.ts:14](https://github.com/huggingface/huggingface.js/blob/f282646/packages/hub/src/types/repo.d.ts#L14)

___

### SpaceSdk

Ƭ **SpaceSdk**: ``"streamlit"`` \| ``"gradio"`` \| ``"docker"`` \| ``"static"``

#### Defined in

[src/types/repo.d.ts:23](https://github.com/huggingface/huggingface.js/blob/f282646/packages/hub/src/types/repo.d.ts#L23)

## Functions

### commit

▸ **commit**(`params`): `Promise`<[`CommitOutput`](interfaces/CommitOutput.md)\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `params` | [`CommitParams`](interfaces/CommitParams.md) |

#### Returns

`Promise`<[`CommitOutput`](interfaces/CommitOutput.md)\>

#### Defined in

[src/lib/commit.ts:342](https://github.com/huggingface/huggingface.js/blob/f282646/packages/hub/src/lib/commit.ts#L342)

___

### createRepo

▸ **createRepo**(`params`): `Promise`<`void`\>

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `params` | `Object` | - |
| `params.credentials` | [`Credentials`](interfaces/Credentials.md) | - |
| `params.files?` | { `content`: `ArrayBuffer` \| `Blob` ; `path`: `string`  }[] | Only a few lightweight files are supported at repo creation |
| `params.hubUrl?` | `string` | - |
| `params.license?` | `string` | - |
| `params.private?` | `boolean` | - |
| `params.repo` | [`RepoId`](interfaces/RepoId.md) | - |
| `params.sdk?` | [`SpaceSdk`](modules.md#spacesdk) | **`Required`** for when repo.type === "space" |

#### Returns

`Promise`<`void`\>

#### Defined in

[src/lib/create-repo.ts:6](https://github.com/huggingface/huggingface.js/blob/f282646/packages/hub/src/lib/create-repo.ts#L6)

___

### deleteRepo

▸ **deleteRepo**(`params`): `Promise`<`void`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `params` | `Object` |
| `params.credentials` | [`Credentials`](interfaces/Credentials.md) |
| `params.hubUrl?` | `string` |
| `params.repo` | [`RepoId`](interfaces/RepoId.md) |

#### Returns

`Promise`<`void`\>

#### Defined in

[src/lib/delete-repo.ts:5](https://github.com/huggingface/huggingface.js/blob/f282646/packages/hub/src/lib/delete-repo.ts#L5)

___

### downloadFile

▸ **downloadFile**(`params`): `Promise`<`Response` \| ``null``\>

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `params` | `Object` | - |
| `params.credentials?` | [`Credentials`](interfaces/Credentials.md) | - |
| `params.hubUrl?` | `string` | - |
| `params.path` | `string` | - |
| `params.raw?` | `boolean` | If true, will download the raw git file. For example, when calling on a file stored with Git LFS, the pointer file will be downloaded instead. |
| `params.repo` | [`RepoId`](interfaces/RepoId.md) | - |
| `params.revision?` | `string` | - |

#### Returns

`Promise`<`Response` \| ``null``\>

null when the file doesn't exist

#### Defined in

[src/lib/download-file.ts:8](https://github.com/huggingface/huggingface.js/blob/f282646/packages/hub/src/lib/download-file.ts#L8)

___

### fileDownloadInfo

▸ **fileDownloadInfo**(`params`): `Promise`<[`FileDownloadInfoOutput`](interfaces/FileDownloadInfoOutput.md) \| ``null``\>

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `params` | `Object` | - |
| `params.credentials?` | [`Credentials`](interfaces/Credentials.md) | - |
| `params.hubUrl?` | `string` | - |
| `params.noContentDisposition?` | `boolean` | To avoid the content-disposition header in the `downloadLink` for LFS files So that on browsers you can use the URL in an iframe for example |
| `params.path` | `string` | - |
| `params.raw?` | `boolean` | To get the raw pointer file behind a LFS file |
| `params.repo` | [`RepoId`](interfaces/RepoId.md) | - |
| `params.revision?` | `string` | - |

#### Returns

`Promise`<[`FileDownloadInfoOutput`](interfaces/FileDownloadInfoOutput.md) \| ``null``\>

null when the file doesn't exist

#### Defined in

[src/lib/file-download-info.ts:16](https://github.com/huggingface/huggingface.js/blob/f282646/packages/hub/src/lib/file-download-info.ts#L16)

___

### listFiles

▸ **listFiles**(`params`): `AsyncGenerator`<[`ListFileEntry`](interfaces/ListFileEntry.md)\>

List files in a folder. To list ALL files in the directory, call it
with params.recursive set to `true`.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `params` | `Object` | - |
| `params.credentials?` | [`Credentials`](interfaces/Credentials.md) | - |
| `params.hubUrl?` | `string` | - |
| `params.path?` | `string` | Eg 'data' for listing all files in the 'data' folder. Leave it empty to list all files in the repo. |
| `params.recursive?` | `boolean` | Do we want to list files in subdirectories? |
| `params.repo` | [`RepoId`](interfaces/RepoId.md) | - |
| `params.revision?` | `string` | - |

#### Returns

`AsyncGenerator`<[`ListFileEntry`](interfaces/ListFileEntry.md)\>

#### Defined in

[src/lib/list-files.ts:31](https://github.com/huggingface/huggingface.js/blob/f282646/packages/hub/src/lib/list-files.ts#L31)
