# Interface: TextGenerationStreamBestOfSequence

## Properties

### finish\_reason

• **finish\_reason**: [`TextGenerationStreamFinishReason`](../enums/TextGenerationStreamFinishReason)

Generation finish reason

#### Defined in

[HfInference.ts:260](https://github.com/huggingface/huggingface.js/blob/main/packages/inference/src/HfInference.ts#L260)

___

### generated\_text

• **generated\_text**: `string`

Generated text

#### Defined in

[HfInference.ts:258](https://github.com/huggingface/huggingface.js/blob/main/packages/inference/src/HfInference.ts#L258)

___

### generated\_tokens

• **generated\_tokens**: `number`

Number of generated tokens

#### Defined in

[HfInference.ts:262](https://github.com/huggingface/huggingface.js/blob/main/packages/inference/src/HfInference.ts#L262)

___

### prefill

• **prefill**: [`TextGenerationStreamPrefillToken`](TextGenerationStreamPrefillToken)[]

Prompt tokens

#### Defined in

[HfInference.ts:266](https://github.com/huggingface/huggingface.js/blob/main/packages/inference/src/HfInference.ts#L266)

___

### seed

• `Optional` **seed**: `number`

Sampling seed if sampling was activated

#### Defined in

[HfInference.ts:264](https://github.com/huggingface/huggingface.js/blob/main/packages/inference/src/HfInference.ts#L264)

___

### tokens

• **tokens**: [`TextGenerationStreamToken`](TextGenerationStreamToken)[]

Generated tokens

#### Defined in

[HfInference.ts:268](https://github.com/huggingface/huggingface.js/blob/main/packages/inference/src/HfInference.ts#L268)
