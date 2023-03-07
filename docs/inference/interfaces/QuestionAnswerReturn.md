# Interface: QuestionAnswerReturn

## Properties

### answer

• **answer**: `string`

A string that’s the answer within the text.

#### Defined in

[HfInference.ts:103](https://github.com/huggingface/huggingface.js/blob/main/packages/inference/src/HfInference.ts#L103)

___

### end

• **end**: `number`

The index (string wise) of the stop of the answer within context.

#### Defined in

[HfInference.ts:107](https://github.com/huggingface/huggingface.js/blob/main/packages/inference/src/HfInference.ts#L107)

___

### score

• **score**: `number`

A float that represents how likely that the answer is correct

#### Defined in

[HfInference.ts:111](https://github.com/huggingface/huggingface.js/blob/main/packages/inference/src/HfInference.ts#L111)

___

### start

• **start**: `number`

The index (string wise) of the start of the answer within context.

#### Defined in

[HfInference.ts:115](https://github.com/huggingface/huggingface.js/blob/main/packages/inference/src/HfInference.ts#L115)
