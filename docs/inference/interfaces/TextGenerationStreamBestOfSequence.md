# Interface: TextGenerationStreamBestOfSequence

## Properties

### finish\_reason

• **finish\_reason**: [`TextGenerationStreamFinishReason`](../modules#textgenerationstreamfinishreason)

Generation finish reason

#### Defined in

[inference/src/tasks/nlp/textGenerationStream.ts:35](https://github.com/huggingface/huggingface.js/blob/main/packages/inference/src/tasks/nlp/textGenerationStream.ts#L35)

___

### generated\_text

• **generated\_text**: `string`

Generated text

#### Defined in

[inference/src/tasks/nlp/textGenerationStream.ts:33](https://github.com/huggingface/huggingface.js/blob/main/packages/inference/src/tasks/nlp/textGenerationStream.ts#L33)

___

### generated\_tokens

• **generated\_tokens**: `number`

Number of generated tokens

#### Defined in

[inference/src/tasks/nlp/textGenerationStream.ts:37](https://github.com/huggingface/huggingface.js/blob/main/packages/inference/src/tasks/nlp/textGenerationStream.ts#L37)

___

### prefill

• **prefill**: [`TextGenerationStreamPrefillToken`](TextGenerationStreamPrefillToken)[]

Prompt tokens

#### Defined in

[inference/src/tasks/nlp/textGenerationStream.ts:41](https://github.com/huggingface/huggingface.js/blob/main/packages/inference/src/tasks/nlp/textGenerationStream.ts#L41)

___

### seed

• `Optional` **seed**: `number`

Sampling seed if sampling was activated

#### Defined in

[inference/src/tasks/nlp/textGenerationStream.ts:39](https://github.com/huggingface/huggingface.js/blob/main/packages/inference/src/tasks/nlp/textGenerationStream.ts#L39)

___

### tokens

• **tokens**: [`TextGenerationStreamToken`](TextGenerationStreamToken)[]

Generated tokens

#### Defined in

[inference/src/tasks/nlp/textGenerationStream.ts:43](https://github.com/huggingface/huggingface.js/blob/main/packages/inference/src/tasks/nlp/textGenerationStream.ts#L43)
