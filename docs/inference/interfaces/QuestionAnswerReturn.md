# Interface: QuestionAnswerReturn

## Properties

### answer

• **answer**: `string`

A string that’s the answer within the text.

#### Defined in

[HfInference.ts:109](https://github.com/huggingface/huggingface.js/blob/main/packages/inference/src/HfInference.ts#L109)

___

### end

• **end**: `number`

The index (string wise) of the stop of the answer within context.

#### Defined in

[HfInference.ts:113](https://github.com/huggingface/huggingface.js/blob/main/packages/inference/src/HfInference.ts#L113)

___

### score

• **score**: `number`

A float that represents how likely that the answer is correct

#### Defined in

[HfInference.ts:117](https://github.com/huggingface/huggingface.js/blob/main/packages/inference/src/HfInference.ts#L117)

___

### start

• **start**: `number`

The index (string wise) of the start of the answer within context.

#### Defined in

[HfInference.ts:121](https://github.com/huggingface/huggingface.js/blob/main/packages/inference/src/HfInference.ts#L121)
