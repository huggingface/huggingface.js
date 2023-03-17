# Interface: SpaceRuntime

## Properties

### errorMessage

• `Optional` **errorMessage**: `string`

#### Defined in

[hub/src/types/public.d.ts:89](https://github.com/huggingface/huggingface.js/blob/main/packages/hub/src/types/public.d.ts#L89)

___

### gcTimeout

• `Optional` **gcTimeout**: ``null`` \| `number`

in seconds

#### Defined in

[hub/src/types/public.d.ts:99](https://github.com/huggingface/huggingface.js/blob/main/packages/hub/src/types/public.d.ts#L99)

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

[hub/src/types/public.d.ts:90](https://github.com/huggingface/huggingface.js/blob/main/packages/hub/src/types/public.d.ts#L90)

___

### resources

• `Optional` **resources**: [`SpaceResourceConfig`](SpaceResourceConfig)

when calling /spaces, those props are only fetched if ?full=true

#### Defined in

[hub/src/types/public.d.ts:97](https://github.com/huggingface/huggingface.js/blob/main/packages/hub/src/types/public.d.ts#L97)

___

### sdk

• `Optional` **sdk**: [`SpaceSdk`](../modules#spacesdk)

#### Defined in

[hub/src/types/public.d.ts:87](https://github.com/huggingface/huggingface.js/blob/main/packages/hub/src/types/public.d.ts#L87)

___

### sdkVersion

• `Optional` **sdkVersion**: `string`

#### Defined in

[hub/src/types/public.d.ts:88](https://github.com/huggingface/huggingface.js/blob/main/packages/hub/src/types/public.d.ts#L88)

___

### stage

• **stage**: [`SpaceStage`](../modules#spacestage)

#### Defined in

[hub/src/types/public.d.ts:86](https://github.com/huggingface/huggingface.js/blob/main/packages/hub/src/types/public.d.ts#L86)
