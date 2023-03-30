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

Ƭ **AudioClassificationArgs**: [`Args`](interfaces/Args) & { `data`: `Blob` \| `ArrayBuffer`  }

#### Defined in

[HfInference.ts:474](https://github.com/huggingface/huggingface.js/blob/main/packages/inference/src/HfInference.ts#L474)

___

### AudioClassificationReturn

Ƭ **AudioClassificationReturn**: [`AudioClassificationReturnValue`](interfaces/AudioClassificationReturnValue)[]

#### Defined in

[HfInference.ts:493](https://github.com/huggingface/huggingface.js/blob/main/packages/inference/src/HfInference.ts#L493)

___

### AutomaticSpeechRecognitionArgs

Ƭ **AutomaticSpeechRecognitionArgs**: [`Args`](interfaces/Args) & { `data`: `Blob` \| `ArrayBuffer`  }

#### Defined in

[HfInference.ts:460](https://github.com/huggingface/huggingface.js/blob/main/packages/inference/src/HfInference.ts#L460)

___

### ConversationalArgs

Ƭ **ConversationalArgs**: [`Args`](interfaces/Args) & { `inputs`: { `generated_responses?`: `string`[] ; `past_user_inputs?`: `string`[] ; `text`: `string`  } ; `parameters?`: { `max_length?`: `number` ; `max_time?`: `number` ; `min_length?`: `number` ; `repetition_penalty?`: `number` ; `temperature?`: `number` ; `top_k?`: `number` ; `top_p?`: `number`  }  }

#### Defined in

[HfInference.ts:313](https://github.com/huggingface/huggingface.js/blob/main/packages/inference/src/HfInference.ts#L313)

___

### FeatureExtractionArgs

Ƭ **FeatureExtractionArgs**: [`Args`](interfaces/Args) & { `inputs`: `Record`<`string`, `unknown`\> \| `Record`<`string`, `unknown`\>[]  }

#### Defined in

[HfInference.ts:369](https://github.com/huggingface/huggingface.js/blob/main/packages/inference/src/HfInference.ts#L369)

___

### FeatureExtractionReturn

Ƭ **FeatureExtractionReturn**: (`number` \| `number`[])[]

Returned values are a list of floats, or a list of list of floats (depending on if you sent a string or a list of string, and if the automatic reduction, usually mean_pooling for instance was applied for you or not. This should be explained on the model's README.

#### Defined in

[HfInference.ts:384](https://github.com/huggingface/huggingface.js/blob/main/packages/inference/src/HfInference.ts#L384)

___

### FillMaskArgs

Ƭ **FillMaskArgs**: [`Args`](interfaces/Args) & { `inputs`: `string`  }

#### Defined in

[HfInference.ts:31](https://github.com/huggingface/huggingface.js/blob/main/packages/inference/src/HfInference.ts#L31)

___

### FillMaskReturn

Ƭ **FillMaskReturn**: { `score`: `number` ; `sequence`: `string` ; `token`: `number` ; `token_str`: `string`  }[]

#### Defined in

[HfInference.ts:35](https://github.com/huggingface/huggingface.js/blob/main/packages/inference/src/HfInference.ts#L35)

___

### ImageClassificationArgs

Ƭ **ImageClassificationArgs**: [`Args`](interfaces/Args) & { `data`: `Blob` \| `ArrayBuffer`  }

#### Defined in

[HfInference.ts:386](https://github.com/huggingface/huggingface.js/blob/main/packages/inference/src/HfInference.ts#L386)

___

### ImageClassificationReturn

Ƭ **ImageClassificationReturn**: [`ImageClassificationReturnValue`](interfaces/ImageClassificationReturnValue)[]

#### Defined in

[HfInference.ts:404](https://github.com/huggingface/huggingface.js/blob/main/packages/inference/src/HfInference.ts#L404)

___

### ImageSegmentationArgs

Ƭ **ImageSegmentationArgs**: [`Args`](interfaces/Args) & { `data`: `Blob` \| `ArrayBuffer`  }

#### Defined in

[HfInference.ts:436](https://github.com/huggingface/huggingface.js/blob/main/packages/inference/src/HfInference.ts#L436)

___

### ImageSegmentationReturn

Ƭ **ImageSegmentationReturn**: [`ImageSegmentationReturnValue`](interfaces/ImageSegmentationReturnValue)[]

#### Defined in

[HfInference.ts:458](https://github.com/huggingface/huggingface.js/blob/main/packages/inference/src/HfInference.ts#L458)

___

### ObjectDetectionArgs

Ƭ **ObjectDetectionArgs**: [`Args`](interfaces/Args) & { `data`: `Blob` \| `ArrayBuffer`  }

#### Defined in

[HfInference.ts:406](https://github.com/huggingface/huggingface.js/blob/main/packages/inference/src/HfInference.ts#L406)

___

### ObjectDetectionReturn

Ƭ **ObjectDetectionReturn**: [`ObjectDetectionReturnValue`](interfaces/ObjectDetectionReturnValue)[]

#### Defined in

[HfInference.ts:434](https://github.com/huggingface/huggingface.js/blob/main/packages/inference/src/HfInference.ts#L434)

___

### QuestionAnswerArgs

Ƭ **QuestionAnswerArgs**: [`Args`](interfaces/Args) & { `inputs`: { `context`: `string` ; `question`: `string`  }  }

#### Defined in

[HfInference.ts:98](https://github.com/huggingface/huggingface.js/blob/main/packages/inference/src/HfInference.ts#L98)

___

### SummarizationArgs

Ƭ **SummarizationArgs**: [`Args`](interfaces/Args) & { `inputs`: `string` ; `parameters?`: { `max_length?`: `number` ; `max_time?`: `number` ; `min_length?`: `number` ; `repetition_penalty?`: `number` ; `temperature?`: `number` ; `top_k?`: `number` ; `top_p?`: `number`  }  }

#### Defined in

[HfInference.ts:54](https://github.com/huggingface/huggingface.js/blob/main/packages/inference/src/HfInference.ts#L54)

___

### TableQuestionAnswerArgs

Ƭ **TableQuestionAnswerArgs**: [`Args`](interfaces/Args) & { `inputs`: { `query`: `string` ; `table`: `Record`<`string`, `string`[]\>  }  }

#### Defined in

[HfInference.ts:124](https://github.com/huggingface/huggingface.js/blob/main/packages/inference/src/HfInference.ts#L124)

___

### TextClassificationArgs

Ƭ **TextClassificationArgs**: [`Args`](interfaces/Args) & { `inputs`: `string`  }

#### Defined in

[HfInference.ts:156](https://github.com/huggingface/huggingface.js/blob/main/packages/inference/src/HfInference.ts#L156)

___

### TextClassificationReturn

Ƭ **TextClassificationReturn**: { `label`: `string` ; `score`: `number`  }[]

#### Defined in

[HfInference.ts:163](https://github.com/huggingface/huggingface.js/blob/main/packages/inference/src/HfInference.ts#L163)

___

### TextGenerationArgs

Ƭ **TextGenerationArgs**: [`Args`](interfaces/Args) & { `inputs`: `string` ; `parameters?`: { `do_sample?`: `boolean` ; `max_new_tokens?`: `number` ; `max_time?`: `number` ; `num_return_sequences?`: `number` ; `repetition_penalty?`: `number` ; `return_full_text?`: `boolean` ; `temperature?`: `number` ; `top_k?`: `number` ; `top_p?`: `number`  }  }

#### Defined in

[HfInference.ts:174](https://github.com/huggingface/huggingface.js/blob/main/packages/inference/src/HfInference.ts#L174)

___

### TextToImageArgs

Ƭ **TextToImageArgs**: [`Args`](interfaces/Args) & { `inputs`: `string` ; `negative_prompt?`: `string`  }

#### Defined in

[HfInference.ts:495](https://github.com/huggingface/huggingface.js/blob/main/packages/inference/src/HfInference.ts#L495)

___

### TextToImageReturn

Ƭ **TextToImageReturn**: `Blob`

#### Defined in

[HfInference.ts:507](https://github.com/huggingface/huggingface.js/blob/main/packages/inference/src/HfInference.ts#L507)

___

### TokenClassificationArgs

Ƭ **TokenClassificationArgs**: [`Args`](interfaces/Args) & { `inputs`: `string` ; `parameters?`: { `aggregation_strategy?`: ``"none"`` \| ``"simple"`` \| ``"first"`` \| ``"average"`` \| ``"max"``  }  }

#### Defined in

[HfInference.ts:226](https://github.com/huggingface/huggingface.js/blob/main/packages/inference/src/HfInference.ts#L226)

___

### TokenClassificationReturn

Ƭ **TokenClassificationReturn**: [`TokenClassificationReturnValue`](interfaces/TokenClassificationReturnValue)[]

#### Defined in

[HfInference.ts:272](https://github.com/huggingface/huggingface.js/blob/main/packages/inference/src/HfInference.ts#L272)

___

### TranslationArgs

Ƭ **TranslationArgs**: [`Args`](interfaces/Args) & { `inputs`: `string`  }

#### Defined in

[HfInference.ts:274](https://github.com/huggingface/huggingface.js/blob/main/packages/inference/src/HfInference.ts#L274)

___

### ZeroShotClassificationArgs

Ƭ **ZeroShotClassificationArgs**: [`Args`](interfaces/Args) & { `inputs`: `string` \| `string`[] ; `parameters`: { `candidate_labels`: `string`[] ; `multi_label?`: `boolean`  }  }

#### Defined in

[HfInference.ts:288](https://github.com/huggingface/huggingface.js/blob/main/packages/inference/src/HfInference.ts#L288)

___

### ZeroShotClassificationReturn

Ƭ **ZeroShotClassificationReturn**: [`ZeroShotClassificationReturnValue`](interfaces/ZeroShotClassificationReturnValue)[]

#### Defined in

[HfInference.ts:311](https://github.com/huggingface/huggingface.js/blob/main/packages/inference/src/HfInference.ts#L311)
