# Interface: QuestionAnsweringOutput

## Properties

### answer

• **answer**: `string`

A string that’s the answer within the text.

#### Defined in

[inference/src/tasks/nlp/questionAnswering.ts:16](https://github.com/huggingface/huggingface.js/blob/main/packages/inference/src/tasks/nlp/questionAnswering.ts#L16)

___

### end

• **end**: `number`

The index (string wise) of the stop of the answer within context.

#### Defined in

[inference/src/tasks/nlp/questionAnswering.ts:20](https://github.com/huggingface/huggingface.js/blob/main/packages/inference/src/tasks/nlp/questionAnswering.ts#L20)

___

### score

• **score**: `number`

A float that represents how likely that the answer is correct

#### Defined in

[inference/src/tasks/nlp/questionAnswering.ts:24](https://github.com/huggingface/huggingface.js/blob/main/packages/inference/src/tasks/nlp/questionAnswering.ts#L24)

___

### start

• **start**: `number`

The index (string wise) of the start of the answer within context.

#### Defined in

[inference/src/tasks/nlp/questionAnswering.ts:28](https://github.com/huggingface/huggingface.js/blob/main/packages/inference/src/tasks/nlp/questionAnswering.ts#L28)
