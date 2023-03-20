# @huggingface/hub

## Classes

- [ApiError](classes/ApiError)
- [InvalidApiResponseFormatError](classes/InvalidApiResponseFormatError)

## Interfaces

- [AuthInfo](interfaces/AuthInfo)
- [CommitDeletedEntry](interfaces/CommitDeletedEntry)
- [CommitFile](interfaces/CommitFile)
- [CommitOutput](interfaces/CommitOutput)
- [CommitParams](interfaces/CommitParams)
- [Credentials](interfaces/Credentials)
- [DatasetEntry](interfaces/DatasetEntry)
- [FileDownloadInfoOutput](interfaces/FileDownloadInfoOutput)
- [ListFileEntry](interfaces/ListFileEntry)
- [ModelEntry](interfaces/ModelEntry)
- [RepoId](interfaces/RepoId)
- [SpaceEntry](interfaces/SpaceEntry)
- [SpaceResourceConfig](interfaces/SpaceResourceConfig)
- [SpaceResourceRequirement](interfaces/SpaceResourceRequirement)
- [SpaceRuntime](interfaces/SpaceRuntime)
- [WhoAmIApp](interfaces/WhoAmIApp)
- [WhoAmIOrg](interfaces/WhoAmIOrg)
- [WhoAmIUser](interfaces/WhoAmIUser)

## Type Aliases

### AccessToken

Ƭ **AccessToken**: `string`

Actually `hf_${string}`, but for convenience, using the string type

#### Defined in

[hub/src/types/public.d.ts:9](https://github.com/huggingface/huggingface.js/blob/main/packages/hub/src/types/public.d.ts#L9)

___

### AccessTokenRole

Ƭ **AccessTokenRole**: ``"admin"`` \| ``"write"`` \| ``"contributor"`` \| ``"read"``

#### Defined in

[hub/src/types/public.d.ts:38](https://github.com/huggingface/huggingface.js/blob/main/packages/hub/src/types/public.d.ts#L38)

___

### AuthType

Ƭ **AuthType**: ``"access_token"`` \| ``"app_token"`` \| ``"app_token_as_user"``

#### Defined in

[hub/src/types/public.d.ts:40](https://github.com/huggingface/huggingface.js/blob/main/packages/hub/src/types/public.d.ts#L40)

___

### CommitOperation

Ƭ **CommitOperation**: [`CommitDeletedEntry`](interfaces/CommitDeletedEntry) \| [`CommitFile`](interfaces/CommitFile)

#### Defined in

[hub/src/lib/commit.ts:47](https://github.com/huggingface/huggingface.js/blob/main/packages/hub/src/lib/commit.ts#L47)

___

### RepoType

Ƭ **RepoType**: ``"space"`` \| ``"dataset"`` \| ``"model"``

#### Defined in

[hub/src/types/public.d.ts:1](https://github.com/huggingface/huggingface.js/blob/main/packages/hub/src/types/public.d.ts#L1)

___

### SpaceHardwareFlavor

Ƭ **SpaceHardwareFlavor**: ``"cpu-basic"`` \| ``"cpu-upgrade"`` \| ``"t4-small"`` \| ``"t4-medium"`` \| ``"a10g-small"`` \| ``"a10g-large"`` \| ``"a100-large"``

#### Defined in

[hub/src/types/public.d.ts:15](https://github.com/huggingface/huggingface.js/blob/main/packages/hub/src/types/public.d.ts#L15)

___

### SpaceSdk

Ƭ **SpaceSdk**: ``"streamlit"`` \| ``"gradio"`` \| ``"docker"`` \| ``"static"``

#### Defined in

[hub/src/types/public.d.ts:24](https://github.com/huggingface/huggingface.js/blob/main/packages/hub/src/types/public.d.ts#L24)

___

### SpaceStage

Ƭ **SpaceStage**: ``"NO_APP_FILE"`` \| ``"CONFIG_ERROR"`` \| ``"BUILDING"`` \| ``"BUILD_ERROR"`` \| ``"RUNNING"`` \| ``"RUNNING_BUILDING"`` \| ``"RUNTIME_ERROR"`` \| ``"DELETING"`` \| ``"PAUSED"`` \| ``"SLEEPING"``

#### Defined in

[hub/src/types/public.d.ts:26](https://github.com/huggingface/huggingface.js/blob/main/packages/hub/src/types/public.d.ts#L26)

___

### Task

Ƭ **Task**: ``"text-classification"`` \| ``"token-classification"`` \| ``"table-question-answering"`` \| ``"question-answering"`` \| ``"zero-shot-classification"`` \| ``"translation"`` \| ``"summarization"`` \| ``"conversational"`` \| ``"feature-extraction"`` \| ``"text-generation"`` \| ``"text2text-generation"`` \| ``"fill-mask"`` \| ``"sentence-similarity"`` \| ``"text-to-speech"`` \| ``"automatic-speech-recognition"`` \| ``"audio-to-audio"`` \| ``"audio-classification"`` \| ``"voice-activity-detection"`` \| ``"depth-estimation"`` \| ``"image-classification"`` \| ``"object-detection"`` \| ``"image-segmentation"`` \| ``"text-to-image"`` \| ``"image-to-text"`` \| ``"image-to-image"`` \| ``"unconditional-image-generation"`` \| ``"video-classification"`` \| ``"reinforcement-learning"`` \| ``"robotics"`` \| ``"tabular-classification"`` \| ``"tabular-regression"`` \| ``"tabular-to-text"`` \| ``"table-to-text"`` \| ``"multiple-choice"`` \| ``"text-retrieval"`` \| ``"time-series-forecasting"`` \| ``"visual-question-answering"`` \| ``"document-question-answering"`` \| ``"zero-shot-image-classification"`` \| ``"graph-ml"`` \| ``"other"``

#### Defined in

[hub/src/types/public.d.ts:42](https://github.com/huggingface/huggingface.js/blob/main/packages/hub/src/types/public.d.ts#L42)

___

### WhoAmI

Ƭ **WhoAmI**: [`WhoAmIApp`](interfaces/WhoAmIApp) \| [`WhoAmIOrg`](interfaces/WhoAmIOrg) \| [`WhoAmIUser`](interfaces/WhoAmIUser)

#### Defined in

[hub/src/lib/who-am-i.ts:58](https://github.com/huggingface/huggingface.js/blob/main/packages/hub/src/lib/who-am-i.ts#L58)

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

[hub/src/lib/commit.ts:357](https://github.com/huggingface/huggingface.js/blob/main/packages/hub/src/lib/commit.ts#L357)

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

[hub/src/lib/create-repo.ts:8](https://github.com/huggingface/huggingface.js/blob/main/packages/hub/src/lib/create-repo.ts#L8)

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

### listDatasets

▸ **listDatasets**(`params?`): `AsyncGenerator`<[`DatasetEntry`](interfaces/DatasetEntry)\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `params?` | `Object` |
| `params.credentials?` | [`Credentials`](interfaces/Credentials) |
| `params.hubUrl?` | `string` |
| `params.search?` | `Object` |
| `params.search.owner?` | `string` |

#### Returns

`AsyncGenerator`<[`DatasetEntry`](interfaces/DatasetEntry)\>

#### Defined in

[hub/src/lib/list-datasets.ts:20](https://github.com/huggingface/huggingface.js/blob/main/packages/hub/src/lib/list-datasets.ts#L20)

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

___

### listModels

▸ **listModels**(`params?`): `AsyncGenerator`<[`ModelEntry`](interfaces/ModelEntry)\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `params?` | `Object` |
| `params.credentials?` | [`Credentials`](interfaces/Credentials) |
| `params.hubUrl?` | `string` |
| `params.search?` | `Object` |
| `params.search.owner?` | `string` |
| `params.search.task?` | [`Task`](modules#task) |

#### Returns

`AsyncGenerator`<[`ModelEntry`](interfaces/ModelEntry)\>

#### Defined in

[hub/src/lib/list-models.ts:21](https://github.com/huggingface/huggingface.js/blob/main/packages/hub/src/lib/list-models.ts#L21)

___

### listSpaces

▸ **listSpaces**(`params?`): `AsyncGenerator`<[`SpaceEntry`](interfaces/SpaceEntry)\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `params?` | `Object` |
| `params.credentials?` | [`Credentials`](interfaces/Credentials) |
| `params.hubUrl?` | `string` |
| `params.search?` | `Object` |
| `params.search.owner?` | `string` |

#### Returns

`AsyncGenerator`<[`SpaceEntry`](interfaces/SpaceEntry)\>

#### Defined in

[hub/src/lib/list-spaces.ts:19](https://github.com/huggingface/huggingface.js/blob/main/packages/hub/src/lib/list-spaces.ts#L19)

___

### whoAmI

▸ **whoAmI**(`params`): `Promise`<[`WhoAmI`](modules#whoami) & { `auth`: [`AuthInfo`](interfaces/AuthInfo)  }\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `params` | `Object` |
| `params.credentials` | [`Credentials`](interfaces/Credentials) |
| `params.hubUrl?` | `string` |

#### Returns

`Promise`<[`WhoAmI`](modules#whoami) & { `auth`: [`AuthInfo`](interfaces/AuthInfo)  }\>

#### Defined in

[hub/src/lib/who-am-i.ts:68](https://github.com/huggingface/huggingface.js/blob/main/packages/hub/src/lib/who-am-i.ts#L68)
