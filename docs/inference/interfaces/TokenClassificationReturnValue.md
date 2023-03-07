# Interface: TokenClassificationReturnValue

## Properties

### end

• **end**: `number`

The offset stringwise where the answer is located. Useful to disambiguate if word occurs multiple times.

#### Defined in

[HfInference.ts:247](https://github.com/huggingface/huggingface.js/blob/main/packages/inference/src/HfInference.ts#L247)

___

### entity\_group

• **entity\_group**: `string`

The type for the entity being recognized (model specific).

#### Defined in

[HfInference.ts:251](https://github.com/huggingface/huggingface.js/blob/main/packages/inference/src/HfInference.ts#L251)

___

### score

• **score**: `number`

How likely the entity was recognized.

#### Defined in

[HfInference.ts:255](https://github.com/huggingface/huggingface.js/blob/main/packages/inference/src/HfInference.ts#L255)

___

### start

• **start**: `number`

The offset stringwise where the answer is located. Useful to disambiguate if word occurs multiple times.

#### Defined in

[HfInference.ts:259](https://github.com/huggingface/huggingface.js/blob/main/packages/inference/src/HfInference.ts#L259)

___

### word

• **word**: `string`

The string that was captured

#### Defined in

[HfInference.ts:263](https://github.com/huggingface/huggingface.js/blob/main/packages/inference/src/HfInference.ts#L263)
