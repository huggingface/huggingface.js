# @huggingface/hub

## Classes

- [ApiError](classes/ApiError)

## Interfaces

- [CommitDeletedEntry](interfaces/CommitDeletedEntry)
- [CommitFile](interfaces/CommitFile)
- [CommitOutput](interfaces/CommitOutput)
- [CommitParams](interfaces/CommitParams)
- [Credentials](interfaces/Credentials)
- [FileDownloadInfoOutput](interfaces/FileDownloadInfoOutput)
- [ListFileEntry](interfaces/ListFileEntry)
- [RepoId](interfaces/RepoId)

## Type Aliases

### AccessToken

Ƭ **AccessToken**: `string`

Actually `hf_${string}`, but for convenience, using the string type

#### Defined in

[hub/src/types/repo.d.ts:9](https://github.com/huggingface/huggingface.js/blob/main/packages/hub/src/types/repo.d.ts#L9)

___

### CommitOperation

Ƭ **CommitOperation**: [`CommitDeletedEntry`](interfaces/CommitDeletedEntry) \| [`CommitFile`](interfaces/CommitFile)

#### Defined in

[hub/src/lib/commit.ts:43](https://github.com/huggingface/huggingface.js/blob/main/packages/hub/src/lib/commit.ts#L43)

___

### RepoType

Ƭ **RepoType**: ``"space"`` \| ``"dataset"`` \| ``"model"``

#### Defined in

[hub/src/types/repo.d.ts:1](https://github.com/huggingface/huggingface.js/blob/main/packages/hub/src/types/repo.d.ts#L1)

___

### SpaceHardwareFlavor

Ƭ **SpaceHardwareFlavor**: ``"cpu-basic"`` \| ``"cpu-upgrade"`` \| ``"t4-small"`` \| ``"t4-medium"`` \| ``"a10g-small"`` \| ``"a10g-large"`` \| ``"a100-large"``

#### Defined in

[hub/src/types/repo.d.ts:15](https://github.com/huggingface/huggingface.js/blob/main/packages/hub/src/types/repo.d.ts#L15)

___

### SpaceSdk

Ƭ **SpaceSdk**: ``"streamlit"`` \| ``"gradio"`` \| ``"docker"`` \| ``"static"``

#### Defined in

[hub/src/types/repo.d.ts:24](https://github.com/huggingface/huggingface.js/blob/main/packages/hub/src/types/repo.d.ts#L24)

## Functions

### commit

▸ **commit**(`params`): `Promise`<[`CommitOutput`](interfaces/CommitOutput)\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `params` | [`CommitParams`](interfaces/CommitParams) |

#### Returns

`Promise`<[`CommitOutput`](interfaces/CommitOutput)\>

#### Defined in

[hub/src/lib/commit.ts:344](https://github.com/huggingface/huggingface.js/blob/main/packages/hub/src/lib/commit.ts#L344)

___

### createRepo

▸ **createRepo**(`params`): `Promise`<{ `repoUrl`: `string`  }\>

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `params` | `Object` | - |
| `params.credentials` | [`Credentials`](interfaces/Credentials) | - |
| `params.files?` | { `content`: `ArrayBuffer` \| `Blob` ; `path`: `string`  }[] | Only a few lightweight files are supported at repo creation |
| `params.hubUrl?` | `string` | - |
| `params.license?` | `string` | - |
| `params.private?` | `boolean` | - |
| `params.repo` | [`RepoId`](interfaces/RepoId) | - |
| `params.sdk?` | [`SpaceSdk`](modules#spacesdk) | **`Required`** for when repo.type === "space" |

#### Returns

`Promise`<{ `repoUrl`: `string`  }\>

#### Defined in

[hub/src/lib/create-repo.ts:7](https://github.com/huggingface/huggingface.js/blob/main/packages/hub/src/lib/create-repo.ts#L7)

___

### deleteRepo

▸ **deleteRepo**(`params`): `Promise`<`void`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `params` | `Object` |
| `params.credentials` | [`Credentials`](interfaces/Credentials) |
| `params.hubUrl?` | `string` |
| `params.repo` | [`RepoId`](interfaces/RepoId) |

#### Returns

`Promise`<`void`\>

#### Defined in

[hub/src/lib/delete-repo.ts:6](https://github.com/huggingface/huggingface.js/blob/main/packages/hub/src/lib/delete-repo.ts#L6)

___

### downloadFile

▸ **downloadFile**(`params`): `Promise`<`Response` \| ``null``\>

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `params` | `Object` | - |
| `params.credentials?` | [`Credentials`](interfaces/Credentials) | - |
| `params.hubUrl?` | `string` | - |
| `params.path` | `string` | - |
| `params.raw?` | `boolean` | If true, will download the raw git file. For example, when calling on a file stored with Git LFS, the pointer file will be downloaded instead. |
| `params.repo` | [`RepoId`](interfaces/RepoId) | - |
| `params.revision?` | `string` | - |

#### Returns

`Promise`<`Response` \| ``null``\>

null when the file doesn't exist

#### Defined in

[hub/src/lib/download-file.ts:9](https://github.com/huggingface/huggingface.js/blob/main/packages/hub/src/lib/download-file.ts#L9)

___

### fileDownloadInfo

▸ **fileDownloadInfo**(`params`): `Promise`<[`FileDownloadInfoOutput`](interfaces/FileDownloadInfoOutput) \| ``null``\>

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `params` | `Object` | - |
| `params.credentials?` | [`Credentials`](interfaces/Credentials) | - |
| `params.hubUrl?` | `string` | - |
| `params.noContentDisposition?` | `boolean` | To avoid the content-disposition header in the `downloadLink` for LFS files So that on browsers you can use the URL in an iframe for example |
| `params.path` | `string` | - |
| `params.raw?` | `boolean` | To get the raw pointer file behind a LFS file |
| `params.repo` | [`RepoId`](interfaces/RepoId) | - |
| `params.revision?` | `string` | - |

#### Returns

`Promise`<[`FileDownloadInfoOutput`](interfaces/FileDownloadInfoOutput) \| ``null``\>

null when the file doesn't exist

#### Defined in

[hub/src/lib/file-download-info.ts:17](https://github.com/huggingface/huggingface.js/blob/main/packages/hub/src/lib/file-download-info.ts#L17)

___

### listFiles

▸ **listFiles**(`params`): `AsyncGenerator`<[`ListFileEntry`](interfaces/ListFileEntry)\>

List files in a folder. To list ALL files in the directory, call it
with params.recursive set to `true`.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `params` | `Object` | - |
| `params.credentials?` | [`Credentials`](interfaces/Credentials) | - |
| `params.hubUrl?` | `string` | - |
| `params.path?` | `string` | Eg 'data' for listing all files in the 'data' folder. Leave it empty to list all files in the repo. |
| `params.recursive?` | `boolean` | Do we want to list files in subdirectories? |
| `params.repo` | [`RepoId`](interfaces/RepoId) | - |
| `params.revision?` | `string` | - |

#### Returns

`AsyncGenerator`<[`ListFileEntry`](interfaces/ListFileEntry)\>

#### Defined in

[hub/src/lib/list-files.ts:31](https://github.com/huggingface/huggingface.js/blob/main/packages/hub/src/lib/list-files.ts#L31)
