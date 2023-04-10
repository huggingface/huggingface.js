# Interface: TextGenerationStreamPrefillToken

## Properties

### id

• **id**: `number`

Token ID from the model tokenizer

#### Defined in

[HfInference.ts:246](https://github.com/huggingface/huggingface.js/blob/main/packages/inference/src/HfInference.ts#L246)

___

### logprob

• `Optional` **logprob**: `number`

Logprob
Optional since the logprob of the first token cannot be computed

#### Defined in

[HfInference.ts:253](https://github.com/huggingface/huggingface.js/blob/main/packages/inference/src/HfInference.ts#L253)

___

### text

• **text**: `string`

Token text

#### Defined in

[HfInference.ts:248](https://github.com/huggingface/huggingface.js/blob/main/packages/inference/src/HfInference.ts#L248)
