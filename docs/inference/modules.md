# @huggingface/inference

## Classes

- [HfInference](classes/HfInference.md)

## Type Aliases

### Args

Ƭ **Args**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `model` | `string` |

#### Defined in

[HfInference.ts:21](https://github.com/huggingface/huggingface.js/blob/f282646/packages/inference/src/HfInference.ts#L21)

___

### AudioClassificationArgs

Ƭ **AudioClassificationArgs**: [`Args`](modules.md#args) & { `data`: `any`  }

#### Defined in

[HfInference.ts:468](https://github.com/huggingface/huggingface.js/blob/f282646/packages/inference/src/HfInference.ts#L468)

___

### AudioClassificationReturn

Ƭ **AudioClassificationReturn**: [`AudioClassificationReturnValue`](modules.md#audioclassificationreturnvalue)[]

#### Defined in

[HfInference.ts:487](https://github.com/huggingface/huggingface.js/blob/f282646/packages/inference/src/HfInference.ts#L487)

___

### AudioClassificationReturnValue

Ƭ **AudioClassificationReturnValue**: `Object`

#### Type declaration

| Name | Type | Description |
| :------ | :------ | :------ |
| `label` | `string` | The label for the class (model specific) |
| `score` | `number` | A float that represents how likely it is that the audio file belongs to this class. |

#### Defined in

[HfInference.ts:475](https://github.com/huggingface/huggingface.js/blob/f282646/packages/inference/src/HfInference.ts#L475)

___

### AutomaticSpeechRecognitionArgs

Ƭ **AutomaticSpeechRecognitionArgs**: [`Args`](modules.md#args) & { `data`: `any`  }

#### Defined in

[HfInference.ts:454](https://github.com/huggingface/huggingface.js/blob/f282646/packages/inference/src/HfInference.ts#L454)

___

### AutomaticSpeechRecognitionReturn

Ƭ **AutomaticSpeechRecognitionReturn**: `Object`

#### Type declaration

| Name | Type | Description |
| :------ | :------ | :------ |
| `text` | `string` | The text that was recognized from the audio |

#### Defined in

[HfInference.ts:461](https://github.com/huggingface/huggingface.js/blob/f282646/packages/inference/src/HfInference.ts#L461)

___

### ConversationalArgs

Ƭ **ConversationalArgs**: [`Args`](modules.md#args) & { `inputs`: { `generated_responses?`: `string`[] ; `past_user_inputs?`: `string`[] ; `text`: `string`  } ; `parameters?`: { `max_length?`: `number` ; `max_time?`: `number` ; `min_length?`: `number` ; `repetition_penalty?`: `number` ; `temperature?`: `number` ; `top_k?`: `number` ; `top_p?`: `number`  }  }

#### Defined in

[HfInference.ts:307](https://github.com/huggingface/huggingface.js/blob/f282646/packages/inference/src/HfInference.ts#L307)

___

### ConversationalReturn

Ƭ **ConversationalReturn**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `conversation` | { `generated_responses`: `string`[] ; `past_user_inputs`: `string`[]  } |
| `conversation.generated_responses` | `string`[] |
| `conversation.past_user_inputs` | `string`[] |
| `generated_text` | `string` |
| `warnings` | `string`[] |

#### Defined in

[HfInference.ts:354](https://github.com/huggingface/huggingface.js/blob/f282646/packages/inference/src/HfInference.ts#L354)

___

### FeatureExtractionArgs

Ƭ **FeatureExtractionArgs**: [`Args`](modules.md#args) & { `inputs`: `Record`<`string`, `any`\> \| `Record`<`string`, `any`\>[]  }

#### Defined in

[HfInference.ts:363](https://github.com/huggingface/huggingface.js/blob/f282646/packages/inference/src/HfInference.ts#L363)

___

### FeatureExtractionReturn

Ƭ **FeatureExtractionReturn**: (`number` \| `number`[])[]

Returned values are a list of floats, or a list of list of floats (depending on if you sent a string or a list of string, and if the automatic reduction, usually mean_pooling for instance was applied for you or not. This should be explained on the model's README.

#### Defined in

[HfInference.ts:378](https://github.com/huggingface/huggingface.js/blob/f282646/packages/inference/src/HfInference.ts#L378)

___

### FillMaskArgs

Ƭ **FillMaskArgs**: [`Args`](modules.md#args) & { `inputs`: `string`  }

#### Defined in

[HfInference.ts:25](https://github.com/huggingface/huggingface.js/blob/f282646/packages/inference/src/HfInference.ts#L25)

___

### FillMaskReturn

Ƭ **FillMaskReturn**: { `score`: `number` ; `sequence`: `string` ; `token`: `number` ; `token_str`: `string`  }[]

#### Defined in

[HfInference.ts:29](https://github.com/huggingface/huggingface.js/blob/f282646/packages/inference/src/HfInference.ts#L29)

___

### ImageClassificationArgs

Ƭ **ImageClassificationArgs**: [`Args`](modules.md#args) & { `data`: `any`  }

#### Defined in

[HfInference.ts:380](https://github.com/huggingface/huggingface.js/blob/f282646/packages/inference/src/HfInference.ts#L380)

___

### ImageClassificationReturn

Ƭ **ImageClassificationReturn**: [`ImageClassificationReturnValue`](modules.md#imageclassificationreturnvalue)[]

#### Defined in

[HfInference.ts:398](https://github.com/huggingface/huggingface.js/blob/f282646/packages/inference/src/HfInference.ts#L398)

___

### ImageClassificationReturnValue

Ƭ **ImageClassificationReturnValue**: `Object`

#### Type declaration

| Name | Type | Description |
| :------ | :------ | :------ |
| `label` | `string` | A float that represents how likely it is that the image file belongs to this class. |
| `score` | `number` | The label for the class (model specific) |

#### Defined in

[HfInference.ts:387](https://github.com/huggingface/huggingface.js/blob/f282646/packages/inference/src/HfInference.ts#L387)

___

### ImageSegmentationArgs

Ƭ **ImageSegmentationArgs**: [`Args`](modules.md#args) & { `data`: `any`  }

#### Defined in

[HfInference.ts:430](https://github.com/huggingface/huggingface.js/blob/f282646/packages/inference/src/HfInference.ts#L430)

___

### ImageSegmentationReturn

Ƭ **ImageSegmentationReturn**: [`ImageSegmentationReturnValue`](modules.md#imagesegmentationreturnvalue)[]

#### Defined in

[HfInference.ts:452](https://github.com/huggingface/huggingface.js/blob/f282646/packages/inference/src/HfInference.ts#L452)

___

### ImageSegmentationReturnValue

Ƭ **ImageSegmentationReturnValue**: `Object`

#### Type declaration

| Name | Type | Description |
| :------ | :------ | :------ |
| `label` | `string` | The label for the class (model specific) of a segment. |
| `mask` | `string` | A str (base64 str of a single channel black-and-white img) representing the mask of a segment. |
| `score` | `number` | A float that represents how likely it is that the detected object belongs to the given class. |

#### Defined in

[HfInference.ts:437](https://github.com/huggingface/huggingface.js/blob/f282646/packages/inference/src/HfInference.ts#L437)

___

### ObjectDetectionArgs

Ƭ **ObjectDetectionArgs**: [`Args`](modules.md#args) & { `data`: `any`  }

#### Defined in

[HfInference.ts:400](https://github.com/huggingface/huggingface.js/blob/f282646/packages/inference/src/HfInference.ts#L400)

___

### ObjectDetectionReturn

Ƭ **ObjectDetectionReturn**: [`ObjectDetectionReturnValue`](modules.md#objectdetectionreturnvalue)[]

#### Defined in

[HfInference.ts:428](https://github.com/huggingface/huggingface.js/blob/f282646/packages/inference/src/HfInference.ts#L428)

___

### ObjectDetectionReturnValue

Ƭ **ObjectDetectionReturnValue**: `Object`

#### Type declaration

| Name | Type | Description |
| :------ | :------ | :------ |
| `box` | { `xmax`: `number` ; `xmin`: `number` ; `ymax`: `number` ; `ymin`: `number`  } | A dict (with keys [xmin,ymin,xmax,ymax]) representing the bounding box of a detected object. |
| `box.xmax` | `number` | - |
| `box.xmin` | `number` | - |
| `box.ymax` | `number` | - |
| `box.ymin` | `number` | - |
| `label` | `string` | The label for the class (model specific) of a detected object. |
| `score` | `number` | A float that represents how likely it is that the detected object belongs to the given class. |

#### Defined in

[HfInference.ts:407](https://github.com/huggingface/huggingface.js/blob/f282646/packages/inference/src/HfInference.ts#L407)

___

### Options

Ƭ **Options**: `Object`

#### Type declaration

| Name | Type | Description |
| :------ | :------ | :------ |
| `retry_on_error?` | `boolean` | (Default: true) Boolean. If a request 503s and wait_for_model is set to false, the request will be retried with the same parameters but with wait_for_model set to true. |
| `use_cache?` | `boolean` | (Default: true). Boolean. There is a cache layer on the inference API to speedup requests we have already seen. Most models can use those results as is as models are deterministic (meaning the results will be the same anyway). However if you use a non deterministic model, you can set this parameter to prevent the caching mechanism from being used resulting in a real new query. |
| `use_gpu?` | `boolean` | (Default: false). Boolean to use GPU instead of CPU for inference (requires Startup plan at least). |
| `wait_for_model?` | `boolean` | (Default: false) Boolean. If the model is not ready, wait for it instead of receiving 503. It limits the number of requests required to get your inference done. It is advised to only set this flag to true after receiving a 503 error as it will limit hanging in your application to known places. |

#### Defined in

[HfInference.ts:1](https://github.com/huggingface/huggingface.js/blob/f282646/packages/inference/src/HfInference.ts#L1)

___

### QuestionAnswerArgs

Ƭ **QuestionAnswerArgs**: [`Args`](modules.md#args) & { `inputs`: { `context`: `string` ; `question`: `string`  }  }

#### Defined in

[HfInference.ts:92](https://github.com/huggingface/huggingface.js/blob/f282646/packages/inference/src/HfInference.ts#L92)

___

### QuestionAnswerReturn

Ƭ **QuestionAnswerReturn**: `Object`

#### Type declaration

| Name | Type | Description |
| :------ | :------ | :------ |
| `answer` | `string` | A string that’s the answer within the text. |
| `end` | `number` | The index (string wise) of the stop of the answer within context. |
| `score` | `number` | A float that represents how likely that the answer is correct |
| `start` | `number` | The index (string wise) of the start of the answer within context. |

#### Defined in

[HfInference.ts:99](https://github.com/huggingface/huggingface.js/blob/f282646/packages/inference/src/HfInference.ts#L99)

___

### SummarizationArgs

Ƭ **SummarizationArgs**: [`Args`](modules.md#args) & { `inputs`: `string` ; `parameters?`: { `max_length?`: `number` ; `max_time?`: `number` ; `min_length?`: `number` ; `repetition_penalty?`: `number` ; `temperature?`: `number` ; `top_k?`: `number` ; `top_p?`: `number`  }  }

#### Defined in

[HfInference.ts:48](https://github.com/huggingface/huggingface.js/blob/f282646/packages/inference/src/HfInference.ts#L48)

___

### SummarizationReturn

Ƭ **SummarizationReturn**: `Object`

#### Type declaration

| Name | Type | Description |
| :------ | :------ | :------ |
| `summary_text` | `string` | The string after translation |

#### Defined in

[HfInference.ts:85](https://github.com/huggingface/huggingface.js/blob/f282646/packages/inference/src/HfInference.ts#L85)

___

### TableQuestionAnswerArgs

Ƭ **TableQuestionAnswerArgs**: [`Args`](modules.md#args) & { `inputs`: { `query`: `string` ; `table`: `Record`<`string`, `string`[]\>  }  }

#### Defined in

[HfInference.ts:118](https://github.com/huggingface/huggingface.js/blob/f282646/packages/inference/src/HfInference.ts#L118)

___

### TableQuestionAnswerReturn

Ƭ **TableQuestionAnswerReturn**: `Object`

#### Type declaration

| Name | Type | Description |
| :------ | :------ | :------ |
| `aggregator` | `string` | The aggregator used to get the answer |
| `answer` | `string` | The plaintext answer |
| `cells` | `string`[] | A list of coordinates of the cells contents |
| `coordinates` | `number`[][] | a list of coordinates of the cells referenced in the answer |

#### Defined in

[HfInference.ts:131](https://github.com/huggingface/huggingface.js/blob/f282646/packages/inference/src/HfInference.ts#L131)

___

### TextClassificationArgs

Ƭ **TextClassificationArgs**: [`Args`](modules.md#args) & { `inputs`: `string`  }

#### Defined in

[HfInference.ts:150](https://github.com/huggingface/huggingface.js/blob/f282646/packages/inference/src/HfInference.ts#L150)

___

### TextClassificationReturn

Ƭ **TextClassificationReturn**: { `label`: `string` ; `score`: `number`  }[]

#### Defined in

[HfInference.ts:157](https://github.com/huggingface/huggingface.js/blob/f282646/packages/inference/src/HfInference.ts#L157)

___

### TextGenerationArgs

Ƭ **TextGenerationArgs**: [`Args`](modules.md#args) & { `inputs`: `string` ; `parameters?`: { `do_sample?`: `boolean` ; `max_new_tokens?`: `number` ; `max_time?`: `number` ; `num_return_sequences?`: `number` ; `repetition_penalty?`: `number` ; `return_full_text?`: `boolean` ; `temperature?`: `number` ; `top_k?`: `number` ; `top_p?`: `number`  }  }

#### Defined in

[HfInference.ts:168](https://github.com/huggingface/huggingface.js/blob/f282646/packages/inference/src/HfInference.ts#L168)

___

### TextGenerationReturn

Ƭ **TextGenerationReturn**: `Object`

#### Type declaration

| Name | Type | Description |
| :------ | :------ | :------ |
| `generated_text` | `string` | The continuated string |

#### Defined in

[HfInference.ts:213](https://github.com/huggingface/huggingface.js/blob/f282646/packages/inference/src/HfInference.ts#L213)

___

### TextToImageArgs

Ƭ **TextToImageArgs**: [`Args`](modules.md#args) & { `inputs`: `string` ; `negative_prompt?`: `string`  }

#### Defined in

[HfInference.ts:489](https://github.com/huggingface/huggingface.js/blob/f282646/packages/inference/src/HfInference.ts#L489)

___

### TextToImageReturn

Ƭ **TextToImageReturn**: `ArrayBuffer`

#### Defined in

[HfInference.ts:501](https://github.com/huggingface/huggingface.js/blob/f282646/packages/inference/src/HfInference.ts#L501)

___

### TokenClassificationArgs

Ƭ **TokenClassificationArgs**: [`Args`](modules.md#args) & { `inputs`: `string` ; `parameters?`: { `aggregation_strategy?`: ``"none"`` \| ``"simple"`` \| ``"first"`` \| ``"average"`` \| ``"max"``  }  }

#### Defined in

[HfInference.ts:220](https://github.com/huggingface/huggingface.js/blob/f282646/packages/inference/src/HfInference.ts#L220)

___

### TokenClassificationReturn

Ƭ **TokenClassificationReturn**: [`TokenClassificationReturnValue`](modules.md#tokenclassificationreturnvalue)[]

#### Defined in

[HfInference.ts:266](https://github.com/huggingface/huggingface.js/blob/f282646/packages/inference/src/HfInference.ts#L266)

___

### TokenClassificationReturnValue

Ƭ **TokenClassificationReturnValue**: `Object`

#### Type declaration

| Name | Type | Description |
| :------ | :------ | :------ |
| `end` | `number` | The offset stringwise where the answer is located. Useful to disambiguate if word occurs multiple times. |
| `entity_group` | `string` | The type for the entity being recognized (model specific). |
| `score` | `number` | How likely the entity was recognized. |
| `start` | `number` | The offset stringwise where the answer is located. Useful to disambiguate if word occurs multiple times. |
| `word` | `string` | The string that was captured |

#### Defined in

[HfInference.ts:243](https://github.com/huggingface/huggingface.js/blob/f282646/packages/inference/src/HfInference.ts#L243)

___

### TranslationArgs

Ƭ **TranslationArgs**: [`Args`](modules.md#args) & { `inputs`: `string`  }

#### Defined in

[HfInference.ts:268](https://github.com/huggingface/huggingface.js/blob/f282646/packages/inference/src/HfInference.ts#L268)

___

### TranslationReturn

Ƭ **TranslationReturn**: `Object`

#### Type declaration

| Name | Type | Description |
| :------ | :------ | :------ |
| `translation_text` | `string` | The string after translation |

#### Defined in

[HfInference.ts:275](https://github.com/huggingface/huggingface.js/blob/f282646/packages/inference/src/HfInference.ts#L275)

___

### ZeroShotClassificationArgs

Ƭ **ZeroShotClassificationArgs**: [`Args`](modules.md#args) & { `inputs`: `string` \| `string`[] ; `parameters`: { `candidate_labels`: `string`[] ; `multi_label?`: `boolean`  }  }

#### Defined in

[HfInference.ts:282](https://github.com/huggingface/huggingface.js/blob/f282646/packages/inference/src/HfInference.ts#L282)

___

### ZeroShotClassificationReturn

Ƭ **ZeroShotClassificationReturn**: [`ZeroShotClassificationReturnValue`](modules.md#zeroshotclassificationreturnvalue)[]

#### Defined in

[HfInference.ts:305](https://github.com/huggingface/huggingface.js/blob/f282646/packages/inference/src/HfInference.ts#L305)

___

### ZeroShotClassificationReturnValue

Ƭ **ZeroShotClassificationReturnValue**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `labels` | `string`[] |
| `scores` | `number`[] |
| `sequence` | `string` |

#### Defined in

[HfInference.ts:299](https://github.com/huggingface/huggingface.js/blob/f282646/packages/inference/src/HfInference.ts#L299)
