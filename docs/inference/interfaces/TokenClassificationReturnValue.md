# Interface: TokenClassificationReturnValue

## Properties

### end

• **end**: `number`

The offset stringwise where the answer is located. Useful to disambiguate if word occurs multiple times.

#### Defined in

[HfInference.ts:337](https://github.com/huggingface/huggingface.js/blob/main/packages/inference/src/HfInference.ts#L337)

___

### entity\_group

• **entity\_group**: `string`

The type for the entity being recognized (model specific).

#### Defined in

[HfInference.ts:341](https://github.com/huggingface/huggingface.js/blob/main/packages/inference/src/HfInference.ts#L341)

___

### score

• **score**: `number`

How likely the entity was recognized.

#### Defined in

[HfInference.ts:345](https://github.com/huggingface/huggingface.js/blob/main/packages/inference/src/HfInference.ts#L345)

___

### start

• **start**: `number`

The offset stringwise where the answer is located. Useful to disambiguate if word occurs multiple times.

#### Defined in

[HfInference.ts:349](https://github.com/huggingface/huggingface.js/blob/main/packages/inference/src/HfInference.ts#L349)

___

### word

• **word**: `string`

The string that was captured

#### Defined in

[HfInference.ts:353](https://github.com/huggingface/huggingface.js/blob/main/packages/inference/src/HfInference.ts#L353)
