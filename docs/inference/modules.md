# @huggingface/inference

## Enumerations

- [TextGenerationStreamFinishReason](enums/TextGenerationStreamFinishReason)

## Classes

- [HfInference](classes/HfInference)

## Interfaces

- [Args](interfaces/Args)
- [AudioClassificationReturnValue](interfaces/AudioClassificationReturnValue)
- [AutomaticSpeechRecognitionReturn](interfaces/AutomaticSpeechRecognitionReturn)
- [ConversationalReturn](interfaces/ConversationalReturn)
- [ImageClassificationReturnValue](interfaces/ImageClassificationReturnValue)
- [ImageSegmentationReturnValue](interfaces/ImageSegmentationReturnValue)
- [ImageToTextReturn](interfaces/ImageToTextReturn)
- [ObjectDetectionReturnValue](interfaces/ObjectDetectionReturnValue)
- [Options](interfaces/Options)
- [QuestionAnswerReturn](interfaces/QuestionAnswerReturn)
- [SummarizationReturn](interfaces/SummarizationReturn)
- [TableQuestionAnswerReturn](interfaces/TableQuestionAnswerReturn)
- [TextGenerationReturn](interfaces/TextGenerationReturn)
- [TextGenerationStreamBestOfSequence](interfaces/TextGenerationStreamBestOfSequence)
- [TextGenerationStreamDetails](interfaces/TextGenerationStreamDetails)
- [TextGenerationStreamPrefillToken](interfaces/TextGenerationStreamPrefillToken)
- [TextGenerationStreamReturn](interfaces/TextGenerationStreamReturn)
- [TextGenerationStreamToken](interfaces/TextGenerationStreamToken)
- [TokenClassificationReturnValue](interfaces/TokenClassificationReturnValue)
- [TranslationReturn](interfaces/TranslationReturn)
- [ZeroShotClassificationReturnValue](interfaces/ZeroShotClassificationReturnValue)

## Type Aliases

### AudioClassificationArgs

Ƭ **AudioClassificationArgs**: [`Args`](interfaces/Args) & { `data`: `Blob` \| `ArrayBuffer`  }

#### Defined in

[HfInference.ts:558](https://github.com/huggingface/huggingface.js/blob/main/packages/inference/src/HfInference.ts#L558)

___

### AudioClassificationReturn

Ƭ **AudioClassificationReturn**: [`AudioClassificationReturnValue`](interfaces/AudioClassificationReturnValue)[]

#### Defined in

[HfInference.ts:577](https://github.com/huggingface/huggingface.js/blob/main/packages/inference/src/HfInference.ts#L577)

___

### AutomaticSpeechRecognitionArgs

Ƭ **AutomaticSpeechRecognitionArgs**: [`Args`](interfaces/Args) & { `data`: `Blob` \| `ArrayBuffer`  }

#### Defined in

[HfInference.ts:544](https://github.com/huggingface/huggingface.js/blob/main/packages/inference/src/HfInference.ts#L544)

___

### ConversationalArgs

Ƭ **ConversationalArgs**: [`Args`](interfaces/Args) & { `inputs`: { `generated_responses?`: `string`[] ; `past_user_inputs?`: `string`[] ; `text`: `string`  } ; `parameters?`: { `max_length?`: `number` ; `max_time?`: `number` ; `min_length?`: `number` ; `repetition_penalty?`: `number` ; `temperature?`: `number` ; `top_k?`: `number` ; `top_p?`: `number`  }  }

#### Defined in

[HfInference.ts:397](https://github.com/huggingface/huggingface.js/blob/main/packages/inference/src/HfInference.ts#L397)

___

### FeatureExtractionArgs

Ƭ **FeatureExtractionArgs**: [`Args`](interfaces/Args) & { `inputs`: `Record`<`string`, `unknown`\> \| `Record`<`string`, `unknown`\>[]  }

#### Defined in

[HfInference.ts:453](https://github.com/huggingface/huggingface.js/blob/main/packages/inference/src/HfInference.ts#L453)

___

### FeatureExtractionReturn

Ƭ **FeatureExtractionReturn**: (`number` \| `number`[])[]

Returned values are a list of floats, or a list of list of floats (depending on if you sent a string or a list of string, and if the automatic reduction, usually mean_pooling for instance was applied for you or not. This should be explained on the model's README.

#### Defined in

[HfInference.ts:468](https://github.com/huggingface/huggingface.js/blob/main/packages/inference/src/HfInference.ts#L468)

___

### FillMaskArgs

Ƭ **FillMaskArgs**: [`Args`](interfaces/Args) & { `inputs`: `string`  }

#### Defined in

[HfInference.ts:35](https://github.com/huggingface/huggingface.js/blob/main/packages/inference/src/HfInference.ts#L35)

___

### FillMaskReturn

Ƭ **FillMaskReturn**: { `score`: `number` ; `sequence`: `string` ; `token`: `number` ; `token_str`: `string`  }[]

#### Defined in

[HfInference.ts:39](https://github.com/huggingface/huggingface.js/blob/main/packages/inference/src/HfInference.ts#L39)

___

### ImageClassificationArgs

Ƭ **ImageClassificationArgs**: [`Args`](interfaces/Args) & { `data`: `Blob` \| `ArrayBuffer`  }

#### Defined in

[HfInference.ts:470](https://github.com/huggingface/huggingface.js/blob/main/packages/inference/src/HfInference.ts#L470)

___

### ImageClassificationReturn

Ƭ **ImageClassificationReturn**: [`ImageClassificationReturnValue`](interfaces/ImageClassificationReturnValue)[]

#### Defined in

[HfInference.ts:488](https://github.com/huggingface/huggingface.js/blob/main/packages/inference/src/HfInference.ts#L488)

___

### ImageSegmentationArgs

Ƭ **ImageSegmentationArgs**: [`Args`](interfaces/Args) & { `data`: `Blob` \| `ArrayBuffer`  }

#### Defined in

[HfInference.ts:520](https://github.com/huggingface/huggingface.js/blob/main/packages/inference/src/HfInference.ts#L520)

___

### ImageSegmentationReturn

Ƭ **ImageSegmentationReturn**: [`ImageSegmentationReturnValue`](interfaces/ImageSegmentationReturnValue)[]

#### Defined in

[HfInference.ts:542](https://github.com/huggingface/huggingface.js/blob/main/packages/inference/src/HfInference.ts#L542)

___

### ImageToTextArgs

Ƭ **ImageToTextArgs**: [`Args`](interfaces/Args) & { `data`: `Blob` \| `ArrayBuffer`  }

#### Defined in

[HfInference.ts:611](https://github.com/huggingface/huggingface.js/blob/main/packages/inference/src/HfInference.ts#L611)

___

### ObjectDetectionArgs

Ƭ **ObjectDetectionArgs**: [`Args`](interfaces/Args) & { `data`: `Blob` \| `ArrayBuffer`  }

#### Defined in

[HfInference.ts:490](https://github.com/huggingface/huggingface.js/blob/main/packages/inference/src/HfInference.ts#L490)

___

### ObjectDetectionReturn

Ƭ **ObjectDetectionReturn**: [`ObjectDetectionReturnValue`](interfaces/ObjectDetectionReturnValue)[]

#### Defined in

[HfInference.ts:518](https://github.com/huggingface/huggingface.js/blob/main/packages/inference/src/HfInference.ts#L518)

___

### QuestionAnswerArgs

Ƭ **QuestionAnswerArgs**: [`Args`](interfaces/Args) & { `inputs`: { `context`: `string` ; `question`: `string`  }  }

#### Defined in

[HfInference.ts:102](https://github.com/huggingface/huggingface.js/blob/main/packages/inference/src/HfInference.ts#L102)

___

### SummarizationArgs

Ƭ **SummarizationArgs**: [`Args`](interfaces/Args) & { `inputs`: `string` ; `parameters?`: { `max_length?`: `number` ; `max_time?`: `number` ; `min_length?`: `number` ; `repetition_penalty?`: `number` ; `temperature?`: `number` ; `top_k?`: `number` ; `top_p?`: `number`  }  }

#### Defined in

[HfInference.ts:58](https://github.com/huggingface/huggingface.js/blob/main/packages/inference/src/HfInference.ts#L58)

___

### TableQuestionAnswerArgs

Ƭ **TableQuestionAnswerArgs**: [`Args`](interfaces/Args) & { `inputs`: { `query`: `string` ; `table`: `Record`<`string`, `string`[]\>  }  }

#### Defined in

[HfInference.ts:128](https://github.com/huggingface/huggingface.js/blob/main/packages/inference/src/HfInference.ts#L128)

___

### TextClassificationArgs

Ƭ **TextClassificationArgs**: [`Args`](interfaces/Args) & { `inputs`: `string`  }

#### Defined in

[HfInference.ts:160](https://github.com/huggingface/huggingface.js/blob/main/packages/inference/src/HfInference.ts#L160)

___

### TextClassificationReturn

Ƭ **TextClassificationReturn**: { `label`: `string` ; `score`: `number`  }[]

#### Defined in

[HfInference.ts:167](https://github.com/huggingface/huggingface.js/blob/main/packages/inference/src/HfInference.ts#L167)

___

### TextGenerationArgs

Ƭ **TextGenerationArgs**: [`Args`](interfaces/Args) & { `inputs`: `string` ; `parameters?`: { `do_sample?`: `boolean` ; `max_new_tokens?`: `number` ; `max_time?`: `number` ; `num_return_sequences?`: `number` ; `repetition_penalty?`: `number` ; `return_full_text?`: `boolean` ; `temperature?`: `number` ; `top_k?`: `number` ; `top_p?`: `number`  }  }

#### Defined in

[HfInference.ts:178](https://github.com/huggingface/huggingface.js/blob/main/packages/inference/src/HfInference.ts#L178)

___

### TextToImageArgs

Ƭ **TextToImageArgs**: [`Args`](interfaces/Args) & { `inputs`: `string` ; `parameters?`: { `guidance_scale?`: `number` ; `height?`: `number` ; `negative_prompt?`: `string` ; `num_inference_steps?`: `number` ; `width?`: `number`  }  }

#### Defined in

[HfInference.ts:579](https://github.com/huggingface/huggingface.js/blob/main/packages/inference/src/HfInference.ts#L579)

___

### TextToImageReturn

Ƭ **TextToImageReturn**: `Blob`

#### Defined in

[HfInference.ts:609](https://github.com/huggingface/huggingface.js/blob/main/packages/inference/src/HfInference.ts#L609)

___

### TokenClassificationArgs

Ƭ **TokenClassificationArgs**: [`Args`](interfaces/Args) & { `inputs`: `string` ; `parameters?`: { `aggregation_strategy?`: ``"none"`` \| ``"simple"`` \| ``"first"`` \| ``"average"`` \| ``"max"``  }  }

#### Defined in

[HfInference.ts:310](https://github.com/huggingface/huggingface.js/blob/main/packages/inference/src/HfInference.ts#L310)

___

### TokenClassificationReturn

Ƭ **TokenClassificationReturn**: [`TokenClassificationReturnValue`](interfaces/TokenClassificationReturnValue)[]

#### Defined in

[HfInference.ts:356](https://github.com/huggingface/huggingface.js/blob/main/packages/inference/src/HfInference.ts#L356)

___

### TranslationArgs

Ƭ **TranslationArgs**: [`Args`](interfaces/Args) & { `inputs`: `string`  }

#### Defined in

[HfInference.ts:358](https://github.com/huggingface/huggingface.js/blob/main/packages/inference/src/HfInference.ts#L358)

___

### ZeroShotClassificationArgs

Ƭ **ZeroShotClassificationArgs**: [`Args`](interfaces/Args) & { `inputs`: `string` \| `string`[] ; `parameters`: { `candidate_labels`: `string`[] ; `multi_label?`: `boolean`  }  }

#### Defined in

[HfInference.ts:372](https://github.com/huggingface/huggingface.js/blob/main/packages/inference/src/HfInference.ts#L372)

___

### ZeroShotClassificationReturn

Ƭ **ZeroShotClassificationReturn**: [`ZeroShotClassificationReturnValue`](interfaces/ZeroShotClassificationReturnValue)[]

#### Defined in

[HfInference.ts:395](https://github.com/huggingface/huggingface.js/blob/main/packages/inference/src/HfInference.ts#L395)
