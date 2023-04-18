# Class: HubApiError

Error thrown when an API call to the Hugging Face Hub fails.

## Hierarchy

- `Error`

  ↳ **`HubApiError`**

## Constructors

### constructor

• **new HubApiError**(`url`, `statusCode`, `requestId?`, `message?`)

#### Parameters

| Name | Type |
| :------ | :------ |
| `url` | `string` |
| `statusCode` | `number` |
| `requestId?` | `string` |
| `message?` | `string` |

#### Overrides

Error.constructor

#### Defined in

[hub/src/error.ts:33](https://github.com/huggingface/huggingface.js/blob/main/packages/hub/src/error.ts#L33)

## Properties

### cause

• `Optional` **cause**: `unknown`

#### Inherited from

Error.cause

#### Defined in

doc-internal/node_modules/.pnpm/typescript@4.9.5/node_modules/typescript/lib/lib.es2022.error.d.ts:26

___

### data

• `Optional` **data**: `JsonObject`

#### Defined in

[hub/src/error.ts:31](https://github.com/huggingface/huggingface.js/blob/main/packages/hub/src/error.ts#L31)

___

### message

• **message**: `string`

#### Inherited from

Error.message

#### Defined in

doc-internal/node_modules/.pnpm/typescript@4.9.5/node_modules/typescript/lib/lib.es5.d.ts:1054

___

### name

• **name**: `string`

#### Inherited from

Error.name

#### Defined in

doc-internal/node_modules/.pnpm/typescript@4.9.5/node_modules/typescript/lib/lib.es5.d.ts:1053

___

### requestId

• `Optional` **requestId**: `string`

#### Defined in

[hub/src/error.ts:30](https://github.com/huggingface/huggingface.js/blob/main/packages/hub/src/error.ts#L30)

___

### stack

• `Optional` **stack**: `string`

#### Inherited from

Error.stack

#### Defined in

doc-internal/node_modules/.pnpm/typescript@4.9.5/node_modules/typescript/lib/lib.es5.d.ts:1055

___

### statusCode

• **statusCode**: `number`

#### Defined in

[hub/src/error.ts:28](https://github.com/huggingface/huggingface.js/blob/main/packages/hub/src/error.ts#L28)

___

### url

• **url**: `string`

#### Defined in

[hub/src/error.ts:29](https://github.com/huggingface/huggingface.js/blob/main/packages/hub/src/error.ts#L29)

___

### prepareStackTrace

▪ `Static` `Optional` **prepareStackTrace**: (`err`: `Error`, `stackTraces`: `CallSite`[]) => `any`

#### Type declaration

▸ (`err`, `stackTraces`): `any`

Optional override for formatting stack traces

**`See`**

https://v8.dev/docs/stack-trace-api#customizing-stack-traces

##### Parameters

| Name | Type |
| :------ | :------ |
| `err` | `Error` |
| `stackTraces` | `CallSite`[] |

##### Returns

`any`

#### Inherited from

Error.prepareStackTrace

#### Defined in

hub/node_modules/.pnpm/@types+node@18.13.0/node_modules/@types/node/globals.d.ts:11

___

### stackTraceLimit

▪ `Static` **stackTraceLimit**: `number`

#### Inherited from

Error.stackTraceLimit

#### Defined in

hub/node_modules/.pnpm/@types+node@18.13.0/node_modules/@types/node/globals.d.ts:13

## Methods

### captureStackTrace

▸ `Static` **captureStackTrace**(`targetObject`, `constructorOpt?`): `void`

Create .stack property on a target object

#### Parameters

| Name | Type |
| :------ | :------ |
| `targetObject` | `object` |
| `constructorOpt?` | `Function` |

#### Returns

`void`

#### Inherited from

Error.captureStackTrace

#### Defined in

hub/node_modules/.pnpm/@types+node@18.13.0/node_modules/@types/node/globals.d.ts:4
