# Interface: SpaceRuntime

## Properties

### errorMessage

• `Optional` **errorMessage**: `string`

#### Defined in

[hub/src/types/public.d.ts:93](https://github.com/huggingface/huggingface.js/blob/main/packages/hub/src/types/public.d.ts#L93)

___

### gcTimeout

• `Optional` **gcTimeout**: ``null`` \| `number`

in seconds

#### Defined in

[hub/src/types/public.d.ts:103](https://github.com/huggingface/huggingface.js/blob/main/packages/hub/src/types/public.d.ts#L103)

___

### hardware

• `Optional` **hardware**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `current` | ``null`` \| [`SpaceHardwareFlavor`](../modules#spacehardwareflavor) |
| `currentPrettyName?` | `string` |
| `requested` | ``null`` \| [`SpaceHardwareFlavor`](../modules#spacehardwareflavor) |
| `requestedPrettyName?` | `string` |

#### Defined in

[hub/src/types/public.d.ts:94](https://github.com/huggingface/huggingface.js/blob/main/packages/hub/src/types/public.d.ts#L94)

___

### resources

• `Optional` **resources**: [`SpaceResourceConfig`](SpaceResourceConfig)

when calling /spaces, those props are only fetched if ?full=true

#### Defined in

[hub/src/types/public.d.ts:101](https://github.com/huggingface/huggingface.js/blob/main/packages/hub/src/types/public.d.ts#L101)

___

### sdk

• `Optional` **sdk**: [`SpaceSdk`](../modules#spacesdk)

#### Defined in

[hub/src/types/public.d.ts:91](https://github.com/huggingface/huggingface.js/blob/main/packages/hub/src/types/public.d.ts#L91)

___

### sdkVersion

• `Optional` **sdkVersion**: `string`

#### Defined in

[hub/src/types/public.d.ts:92](https://github.com/huggingface/huggingface.js/blob/main/packages/hub/src/types/public.d.ts#L92)

___

### stage

• **stage**: [`SpaceStage`](../modules#spacestage)

#### Defined in

[hub/src/types/public.d.ts:90](https://github.com/huggingface/huggingface.js/blob/main/packages/hub/src/types/public.d.ts#L90)
