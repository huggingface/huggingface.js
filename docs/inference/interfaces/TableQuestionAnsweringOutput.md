# Interface: TableQuestionAnsweringOutput

## Properties

### aggregator

• **aggregator**: `string`

The aggregator used to get the answer

#### Defined in

[tasks/nlp/tableQuestionAnswering.ts:22](https://github.com/huggingface/huggingface.js/blob/main/packages/inference/src/tasks/nlp/tableQuestionAnswering.ts#L22)

___

### answer

• **answer**: `string`

The plaintext answer

#### Defined in

[tasks/nlp/tableQuestionAnswering.ts:26](https://github.com/huggingface/huggingface.js/blob/main/packages/inference/src/tasks/nlp/tableQuestionAnswering.ts#L26)

___

### cells

• **cells**: `string`[]

A list of coordinates of the cells contents

#### Defined in

[tasks/nlp/tableQuestionAnswering.ts:30](https://github.com/huggingface/huggingface.js/blob/main/packages/inference/src/tasks/nlp/tableQuestionAnswering.ts#L30)

___

### coordinates

• **coordinates**: `number`[][]

a list of coordinates of the cells referenced in the answer

#### Defined in

[tasks/nlp/tableQuestionAnswering.ts:34](https://github.com/huggingface/huggingface.js/blob/main/packages/inference/src/tasks/nlp/tableQuestionAnswering.ts#L34)
