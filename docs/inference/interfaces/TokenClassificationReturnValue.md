# Interface: TokenClassificationReturnValue

## Properties

### end

• **end**: `number`

The offset stringwise where the answer is located. Useful to disambiguate if word occurs multiple times.

#### Defined in

[HfInference.ts:253](https://github.com/huggingface/huggingface.js/blob/main/packages/inference/src/HfInference.ts#L253)

___

### entity\_group

• **entity\_group**: `string`

The type for the entity being recognized (model specific).

#### Defined in

[HfInference.ts:257](https://github.com/huggingface/huggingface.js/blob/main/packages/inference/src/HfInference.ts#L257)

___

### score

• **score**: `number`

How likely the entity was recognized.

#### Defined in

[HfInference.ts:261](https://github.com/huggingface/huggingface.js/blob/main/packages/inference/src/HfInference.ts#L261)

___

### start

• **start**: `number`

The offset stringwise where the answer is located. Useful to disambiguate if word occurs multiple times.

#### Defined in

[HfInference.ts:265](https://github.com/huggingface/huggingface.js/blob/main/packages/inference/src/HfInference.ts#L265)

___

### word

• **word**: `string`

The string that was captured

#### Defined in

[HfInference.ts:269](https://github.com/huggingface/huggingface.js/blob/main/packages/inference/src/HfInference.ts#L269)
