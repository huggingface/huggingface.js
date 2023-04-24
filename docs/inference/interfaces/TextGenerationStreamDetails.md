# Interface: TextGenerationStreamDetails

## Properties

### best\_of\_sequences

• `Optional` **best\_of\_sequences**: [`TextGenerationStreamBestOfSequence`](TextGenerationStreamBestOfSequence)[]

Additional sequences when using the `best_of` parameter

#### Defined in

[inference/src/tasks/nlp/textGenerationStream.ts:66](https://github.com/huggingface/huggingface.js/blob/main/packages/inference/src/tasks/nlp/textGenerationStream.ts#L66)

___

### finish\_reason

• **finish\_reason**: [`TextGenerationStreamFinishReason`](../modules#textgenerationstreamfinishreason)

Generation finish reason

#### Defined in

[inference/src/tasks/nlp/textGenerationStream.ts:56](https://github.com/huggingface/huggingface.js/blob/main/packages/inference/src/tasks/nlp/textGenerationStream.ts#L56)

___

### generated\_tokens

• **generated\_tokens**: `number`

Number of generated tokens

#### Defined in

[inference/src/tasks/nlp/textGenerationStream.ts:58](https://github.com/huggingface/huggingface.js/blob/main/packages/inference/src/tasks/nlp/textGenerationStream.ts#L58)

___

### prefill

• **prefill**: [`TextGenerationStreamPrefillToken`](TextGenerationStreamPrefillToken)[]

Prompt tokens

#### Defined in

[inference/src/tasks/nlp/textGenerationStream.ts:62](https://github.com/huggingface/huggingface.js/blob/main/packages/inference/src/tasks/nlp/textGenerationStream.ts#L62)

___

### seed

• `Optional` **seed**: `number`

Sampling seed if sampling was activated

#### Defined in

[inference/src/tasks/nlp/textGenerationStream.ts:60](https://github.com/huggingface/huggingface.js/blob/main/packages/inference/src/tasks/nlp/textGenerationStream.ts#L60)

___

### tokens

• **tokens**: [`TextGenerationStreamToken`](TextGenerationStreamToken)[]

#### Defined in

[inference/src/tasks/nlp/textGenerationStream.ts:64](https://github.com/huggingface/huggingface.js/blob/main/packages/inference/src/tasks/nlp/textGenerationStream.ts#L64)
