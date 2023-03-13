# @huggingface/inference

## Classes

- [HfInference](classes/HfInference)

## Interfaces

- [Args](interfaces/Args)
- [AudioClassificationReturnValue](interfaces/AudioClassificationReturnValue)
- [AutomaticSpeechRecognitionReturn](interfaces/AutomaticSpeechRecognitionReturn)
- [ConversationalReturn](interfaces/ConversationalReturn)
- [ImageClassificationReturnValue](interfaces/ImageClassificationReturnValue)
- [ImageSegmentationReturnValue](interfaces/ImageSegmentationReturnValue)
- [ObjectDetectionReturnValue](interfaces/ObjectDetectionReturnValue)
- [Options](interfaces/Options)
- [QuestionAnswerReturn](interfaces/QuestionAnswerReturn)
- [SummarizationReturn](interfaces/SummarizationReturn)
- [TableQuestionAnswerReturn](interfaces/TableQuestionAnswerReturn)
- [TextGenerationReturn](interfaces/TextGenerationReturn)
- [TokenClassificationReturnValue](interfaces/TokenClassificationReturnValue)
- [TranslationReturn](interfaces/TranslationReturn)
- [ZeroShotClassificationReturnValue](interfaces/ZeroShotClassificationReturnValue)

## Type Aliases

### AudioClassificationArgs

Ƭ **AudioClassificationArgs**: [`Args`](interfaces/Args) & { `data`: `any`  }

#### Defined in

[HfInference.ts:468](https://github.com/huggingface/huggingface.js/blob/main/packages/inference/src/HfInference.ts#L468)

___

### AudioClassificationReturn

Ƭ **AudioClassificationReturn**: [`AudioClassificationReturnValue`](interfaces/AudioClassificationReturnValue)[]

#### Defined in

[HfInference.ts:487](https://github.com/huggingface/huggingface.js/blob/main/packages/inference/src/HfInference.ts#L487)

___

### AutomaticSpeechRecognitionArgs

Ƭ **AutomaticSpeechRecognitionArgs**: [`Args`](interfaces/Args) & { `data`: `any`  }

#### Defined in

[HfInference.ts:454](https://github.com/huggingface/huggingface.js/blob/main/packages/inference/src/HfInference.ts#L454)

___

### ConversationalArgs

Ƭ **ConversationalArgs**: [`Args`](interfaces/Args) & { `inputs`: { `generated_responses?`: `string`[] ; `past_user_inputs?`: `string`[] ; `text`: `string`  } ; `parameters?`: { `max_length?`: `number` ; `max_time?`: `number` ; `min_length?`: `number` ; `repetition_penalty?`: `number` ; `temperature?`: `number` ; `top_k?`: `number` ; `top_p?`: `number`  }  }

#### Defined in

[HfInference.ts:307](https://github.com/huggingface/huggingface.js/blob/main/packages/inference/src/HfInference.ts#L307)

___

### FeatureExtractionArgs

Ƭ **FeatureExtractionArgs**: [`Args`](interfaces/Args) & { `inputs`: `Record`<`string`, `any`\> \| `Record`<`string`, `any`\>[]  }

#### Defined in

[HfInference.ts:363](https://github.com/huggingface/huggingface.js/blob/main/packages/inference/src/HfInference.ts#L363)

___

### FeatureExtractionReturn

Ƭ **FeatureExtractionReturn**: (`number` \| `number`[])[]

Returned values are a list of floats, or a list of list of floats (depending on if you sent a string or a list of string, and if the automatic reduction, usually mean_pooling for instance was applied for you or not. This should be explained on the model's README.

#### Defined in

[HfInference.ts:378](https://github.com/huggingface/huggingface.js/blob/main/packages/inference/src/HfInference.ts#L378)

___

### FillMaskArgs

Ƭ **FillMaskArgs**: [`Args`](interfaces/Args) & { `inputs`: `string`  }

#### Defined in

[HfInference.ts:25](https://github.com/huggingface/huggingface.js/blob/main/packages/inference/src/HfInference.ts#L25)

___

### FillMaskReturn

Ƭ **FillMaskReturn**: { `score`: `number` ; `sequence`: `string` ; `token`: `number` ; `token_str`: `string`  }[]

#### Defined in

[HfInference.ts:29](https://github.com/huggingface/huggingface.js/blob/main/packages/inference/src/HfInference.ts#L29)

___

### ImageClassificationArgs

Ƭ **ImageClassificationArgs**: [`Args`](interfaces/Args) & { `data`: `any`  }

#### Defined in

[HfInference.ts:380](https://github.com/huggingface/huggingface.js/blob/main/packages/inference/src/HfInference.ts#L380)

___

### ImageClassificationReturn

Ƭ **ImageClassificationReturn**: [`ImageClassificationReturnValue`](interfaces/ImageClassificationReturnValue)[]

#### Defined in

[HfInference.ts:398](https://github.com/huggingface/huggingface.js/blob/main/packages/inference/src/HfInference.ts#L398)

___

### ImageSegmentationArgs

Ƭ **ImageSegmentationArgs**: [`Args`](interfaces/Args) & { `data`: `any`  }

#### Defined in

[HfInference.ts:430](https://github.com/huggingface/huggingface.js/blob/main/packages/inference/src/HfInference.ts#L430)

___

### ImageSegmentationReturn

Ƭ **ImageSegmentationReturn**: [`ImageSegmentationReturnValue`](interfaces/ImageSegmentationReturnValue)[]

#### Defined in

[HfInference.ts:452](https://github.com/huggingface/huggingface.js/blob/main/packages/inference/src/HfInference.ts#L452)

___

### ObjectDetectionArgs

Ƭ **ObjectDetectionArgs**: [`Args`](interfaces/Args) & { `data`: `any`  }

#### Defined in

[HfInference.ts:400](https://github.com/huggingface/huggingface.js/blob/main/packages/inference/src/HfInference.ts#L400)

___

### ObjectDetectionReturn

Ƭ **ObjectDetectionReturn**: [`ObjectDetectionReturnValue`](interfaces/ObjectDetectionReturnValue)[]

#### Defined in

[HfInference.ts:428](https://github.com/huggingface/huggingface.js/blob/main/packages/inference/src/HfInference.ts#L428)

___

### QuestionAnswerArgs

Ƭ **QuestionAnswerArgs**: [`Args`](interfaces/Args) & { `inputs`: { `context`: `string` ; `question`: `string`  }  }

#### Defined in

[HfInference.ts:92](https://github.com/huggingface/huggingface.js/blob/main/packages/inference/src/HfInference.ts#L92)

___

### SummarizationArgs

Ƭ **SummarizationArgs**: [`Args`](interfaces/Args) & { `inputs`: `string` ; `parameters?`: { `max_length?`: `number` ; `max_time?`: `number` ; `min_length?`: `number` ; `repetition_penalty?`: `number` ; `temperature?`: `number` ; `top_k?`: `number` ; `top_p?`: `number`  }  }

#### Defined in

[HfInference.ts:48](https://github.com/huggingface/huggingface.js/blob/main/packages/inference/src/HfInference.ts#L48)

___

### TableQuestionAnswerArgs

Ƭ **TableQuestionAnswerArgs**: [`Args`](interfaces/Args) & { `inputs`: { `query`: `string` ; `table`: `Record`<`string`, `string`[]\>  }  }

#### Defined in

[HfInference.ts:118](https://github.com/huggingface/huggingface.js/blob/main/packages/inference/src/HfInference.ts#L118)

___

### TextClassificationArgs

Ƭ **TextClassificationArgs**: [`Args`](interfaces/Args) & { `inputs`: `string`  }

#### Defined in

[HfInference.ts:150](https://github.com/huggingface/huggingface.js/blob/main/packages/inference/src/HfInference.ts#L150)

___

### TextClassificationReturn

Ƭ **TextClassificationReturn**: { `label`: `string` ; `score`: `number`  }[]

#### Defined in

[HfInference.ts:157](https://github.com/huggingface/huggingface.js/blob/main/packages/inference/src/HfInference.ts#L157)

___

### TextGenerationArgs

Ƭ **TextGenerationArgs**: [`Args`](interfaces/Args) & { `inputs`: `string` ; `parameters?`: { `do_sample?`: `boolean` ; `max_new_tokens?`: `number` ; `max_time?`: `number` ; `num_return_sequences?`: `number` ; `repetition_penalty?`: `number` ; `return_full_text?`: `boolean` ; `temperature?`: `number` ; `top_k?`: `number` ; `top_p?`: `number`  }  }

#### Defined in

[HfInference.ts:168](https://github.com/huggingface/huggingface.js/blob/main/packages/inference/src/HfInference.ts#L168)

___

### TextToImageArgs

Ƭ **TextToImageArgs**: [`Args`](interfaces/Args) & { `inputs`: `string` ; `negative_prompt?`: `string`  }

#### Defined in

[HfInference.ts:489](https://github.com/huggingface/huggingface.js/blob/main/packages/inference/src/HfInference.ts#L489)

___

### TextToImageReturn

Ƭ **TextToImageReturn**: `Blob`

#### Defined in

[HfInference.ts:501](https://github.com/huggingface/huggingface.js/blob/main/packages/inference/src/HfInference.ts#L501)

___

### TokenClassificationArgs

Ƭ **TokenClassificationArgs**: [`Args`](interfaces/Args) & { `inputs`: `string` ; `parameters?`: { `aggregation_strategy?`: ``"none"`` \| ``"simple"`` \| ``"first"`` \| ``"average"`` \| ``"max"``  }  }

#### Defined in

[HfInference.ts:220](https://github.com/huggingface/huggingface.js/blob/main/packages/inference/src/HfInference.ts#L220)

___

### TokenClassificationReturn

Ƭ **TokenClassificationReturn**: [`TokenClassificationReturnValue`](interfaces/TokenClassificationReturnValue)[]

#### Defined in

[HfInference.ts:266](https://github.com/huggingface/huggingface.js/blob/main/packages/inference/src/HfInference.ts#L266)

___

### TranslationArgs

Ƭ **TranslationArgs**: [`Args`](interfaces/Args) & { `inputs`: `string`  }

#### Defined in

[HfInference.ts:268](https://github.com/huggingface/huggingface.js/blob/main/packages/inference/src/HfInference.ts#L268)

___

### ZeroShotClassificationArgs

Ƭ **ZeroShotClassificationArgs**: [`Args`](interfaces/Args) & { `inputs`: `string` \| `string`[] ; `parameters`: { `candidate_labels`: `string`[] ; `multi_label?`: `boolean`  }  }

#### Defined in

[HfInference.ts:282](https://github.com/huggingface/huggingface.js/blob/main/packages/inference/src/HfInference.ts#L282)

___

### ZeroShotClassificationReturn

Ƭ **ZeroShotClassificationReturn**: [`ZeroShotClassificationReturnValue`](interfaces/ZeroShotClassificationReturnValue)[]

#### Defined in

[HfInference.ts:305](https://github.com/huggingface/huggingface.js/blob/main/packages/inference/src/HfInference.ts#L305)
