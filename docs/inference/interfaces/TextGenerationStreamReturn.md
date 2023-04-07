# Interface: TextGenerationStreamReturn

## Properties

### details

• `Optional` **details**: [`TextGenerationStreamDetails`](TextGenerationStreamDetails)

Generation details
Only available when the generation is finished

#### Defined in

[HfInference.ts:307](https://github.com/huggingface/huggingface.js/blob/main/packages/inference/src/HfInference.ts#L307)

___

### generated\_text

• `Optional` **generated\_text**: `string`

Complete generated text
Only available when the generation is finished

#### Defined in

[HfInference.ts:302](https://github.com/huggingface/huggingface.js/blob/main/packages/inference/src/HfInference.ts#L302)

___

### token

• **token**: [`TextGenerationStreamToken`](TextGenerationStreamToken)

Generated token, one at a time

#### Defined in

[HfInference.ts:297](https://github.com/huggingface/huggingface.js/blob/main/packages/inference/src/HfInference.ts#L297)
