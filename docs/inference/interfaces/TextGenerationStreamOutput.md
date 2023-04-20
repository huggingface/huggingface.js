# Interface: TextGenerationStreamOutput

## Properties

### details

• **details**: ``null`` \| [`TextGenerationStreamDetails`](TextGenerationStreamDetails)

Generation details
Only available when the generation is finished

#### Defined in

[tasks/nlp/textGenerationStream.ts:81](https://github.com/huggingface/huggingface.js/blob/main/packages/inference/src/tasks/nlp/textGenerationStream.ts#L81)

___

### generated\_text

• **generated\_text**: ``null`` \| `string`

Complete generated text
Only available when the generation is finished

#### Defined in

[tasks/nlp/textGenerationStream.ts:76](https://github.com/huggingface/huggingface.js/blob/main/packages/inference/src/tasks/nlp/textGenerationStream.ts#L76)

___

### token

• **token**: [`TextGenerationStreamToken`](TextGenerationStreamToken)

Generated token, one at a time

#### Defined in

[tasks/nlp/textGenerationStream.ts:71](https://github.com/huggingface/huggingface.js/blob/main/packages/inference/src/tasks/nlp/textGenerationStream.ts#L71)
