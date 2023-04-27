# Interface: TextGenerationStreamPrefillToken

## Properties

### id

• **id**: `number`

Token ID from the model tokenizer

#### Defined in

[inference/src/tasks/nlp/textGenerationStream.ts:21](https://github.com/huggingface/huggingface.js/blob/main/packages/inference/src/tasks/nlp/textGenerationStream.ts#L21)

___

### logprob

• `Optional` **logprob**: `number`

Logprob
Optional since the logprob of the first token cannot be computed

#### Defined in

[inference/src/tasks/nlp/textGenerationStream.ts:28](https://github.com/huggingface/huggingface.js/blob/main/packages/inference/src/tasks/nlp/textGenerationStream.ts#L28)

___

### text

• **text**: `string`

Token text

#### Defined in

[inference/src/tasks/nlp/textGenerationStream.ts:23](https://github.com/huggingface/huggingface.js/blob/main/packages/inference/src/tasks/nlp/textGenerationStream.ts#L23)
