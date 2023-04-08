# Interface: TextGenerationStreamDetails

## Properties

### best\_of\_sequences

• `Optional` **best\_of\_sequences**: [`TextGenerationStreamBestOfSequence`](TextGenerationStreamBestOfSequence)[]

Additional sequences when using the `best_of` parameter

#### Defined in

[HfInference.ts:292](https://github.com/huggingface/huggingface.js/blob/main/packages/inference/src/HfInference.ts#L292)

___

### finish\_reason

• **finish\_reason**: [`TextGenerationStreamFinishReason`](../enums/TextGenerationStreamFinishReason)

Generation finish reason

#### Defined in

[HfInference.ts:282](https://github.com/huggingface/huggingface.js/blob/main/packages/inference/src/HfInference.ts#L282)

___

### generated\_tokens

• **generated\_tokens**: `number`

Number of generated tokens

#### Defined in

[HfInference.ts:284](https://github.com/huggingface/huggingface.js/blob/main/packages/inference/src/HfInference.ts#L284)

___

### prefill

• **prefill**: [`TextGenerationStreamPrefillToken`](TextGenerationStreamPrefillToken)[]

Prompt tokens

#### Defined in

[HfInference.ts:288](https://github.com/huggingface/huggingface.js/blob/main/packages/inference/src/HfInference.ts#L288)

___

### seed

• `Optional` **seed**: `number`

Sampling seed if sampling was activated

#### Defined in

[HfInference.ts:286](https://github.com/huggingface/huggingface.js/blob/main/packages/inference/src/HfInference.ts#L286)

___

### tokens

• **tokens**: [`TextGenerationStreamToken`](TextGenerationStreamToken)[]

#### Defined in

[HfInference.ts:290](https://github.com/huggingface/huggingface.js/blob/main/packages/inference/src/HfInference.ts#L290)
