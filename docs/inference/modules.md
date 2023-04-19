# @huggingface/inference

## Classes

- [HfInference](classes/HfInference)
- [HfInferenceEndpoint](classes/HfInferenceEndpoint)

## Interfaces

- [AudioClassificationOutputValue](interfaces/AudioClassificationOutputValue)
- [AutomaticSpeechRecognitionOutput](interfaces/AutomaticSpeechRecognitionOutput)
- [BaseArgs](interfaces/BaseArgs)
- [ConversationalOutput](interfaces/ConversationalOutput)
- [ImageClassificationOutputValue](interfaces/ImageClassificationOutputValue)
- [ImageSegmentationOutputValue](interfaces/ImageSegmentationOutputValue)
- [ImageToTextOutput](interfaces/ImageToTextOutput)
- [ObjectDetectionOutputValue](interfaces/ObjectDetectionOutputValue)
- [Options](interfaces/Options)
- [QuestionAnsweringOutput](interfaces/QuestionAnsweringOutput)
- [SummarizationOutput](interfaces/SummarizationOutput)
- [TableQuestionAnsweringOutput](interfaces/TableQuestionAnsweringOutput)
- [TextGenerationOutput](interfaces/TextGenerationOutput)
- [TextGenerationStreamBestOfSequence](interfaces/TextGenerationStreamBestOfSequence)
- [TextGenerationStreamDetails](interfaces/TextGenerationStreamDetails)
- [TextGenerationStreamOutput](interfaces/TextGenerationStreamOutput)
- [TextGenerationStreamPrefillToken](interfaces/TextGenerationStreamPrefillToken)
- [TextGenerationStreamToken](interfaces/TextGenerationStreamToken)
- [TokenClassificationOutputValue](interfaces/TokenClassificationOutputValue)
- [TranslationOutput](interfaces/TranslationOutput)
- [ZeroShotClassificationOutputValue](interfaces/ZeroShotClassificationOutputValue)

## Type Aliases

### AudioClassificationArgs

Ƭ **AudioClassificationArgs**: [`BaseArgs`](interfaces/BaseArgs) & { `data`: `Blob` \| `ArrayBuffer`  }

#### Defined in

[tasks/audio/audioClassification.ts:5](https://github.com/huggingface/huggingface.js/blob/main/packages/inference/src/tasks/audio/audioClassification.ts#L5)

___

### AudioClassificationReturn

Ƭ **AudioClassificationReturn**: [`AudioClassificationOutputValue`](interfaces/AudioClassificationOutputValue)[]

#### Defined in

[tasks/audio/audioClassification.ts:24](https://github.com/huggingface/huggingface.js/blob/main/packages/inference/src/tasks/audio/audioClassification.ts#L24)

___

### AutomaticSpeechRecognitionArgs

Ƭ **AutomaticSpeechRecognitionArgs**: [`BaseArgs`](interfaces/BaseArgs) & { `data`: `Blob` \| `ArrayBuffer`  }

#### Defined in

[tasks/audio/automaticSpeechRecognition.ts:5](https://github.com/huggingface/huggingface.js/blob/main/packages/inference/src/tasks/audio/automaticSpeechRecognition.ts#L5)

___

### ConversationalArgs

Ƭ **ConversationalArgs**: [`BaseArgs`](interfaces/BaseArgs) & { `inputs`: { `generated_responses?`: `string`[] ; `past_user_inputs?`: `string`[] ; `text`: `string`  } ; `parameters?`: { `max_length?`: `number` ; `max_time?`: `number` ; `min_length?`: `number` ; `repetition_penalty?`: `number` ; `temperature?`: `number` ; `top_k?`: `number` ; `top_p?`: `number`  }  }

#### Defined in

[tasks/nlp/conversational.ts:5](https://github.com/huggingface/huggingface.js/blob/main/packages/inference/src/tasks/nlp/conversational.ts#L5)

___

### FeatureExtractionArgs

Ƭ **FeatureExtractionArgs**: [`BaseArgs`](interfaces/BaseArgs) & { `inputs`: `string` \| `string`[]  }

#### Defined in

[tasks/nlp/featureExtraction.ts:5](https://github.com/huggingface/huggingface.js/blob/main/packages/inference/src/tasks/nlp/featureExtraction.ts#L5)

___

### FeatureExtractionOutput

Ƭ **FeatureExtractionOutput**: (`number` \| `number`[])[]

Returned values are a list of floats, or a list of list of floats (depending on if you sent a string or a list of string, and if the automatic reduction, usually mean_pooling for instance was applied for you or not. This should be explained on the model's README.

#### Defined in

[tasks/nlp/featureExtraction.ts:18](https://github.com/huggingface/huggingface.js/blob/main/packages/inference/src/tasks/nlp/featureExtraction.ts#L18)

___

### FillMaskArgs

Ƭ **FillMaskArgs**: [`BaseArgs`](interfaces/BaseArgs) & { `inputs`: `string`  }

#### Defined in

[tasks/nlp/fillMask.ts:5](https://github.com/huggingface/huggingface.js/blob/main/packages/inference/src/tasks/nlp/fillMask.ts#L5)

___

### FillMaskOutput

Ƭ **FillMaskOutput**: { `score`: `number` ; `sequence`: `string` ; `token`: `number` ; `token_str`: `string`  }[]

#### Defined in

[tasks/nlp/fillMask.ts:9](https://github.com/huggingface/huggingface.js/blob/main/packages/inference/src/tasks/nlp/fillMask.ts#L9)

___

### ImageClassificationArgs

Ƭ **ImageClassificationArgs**: [`BaseArgs`](interfaces/BaseArgs) & { `data`: `Blob` \| `ArrayBuffer`  }

#### Defined in

[tasks/cv/imageClassification.ts:5](https://github.com/huggingface/huggingface.js/blob/main/packages/inference/src/tasks/cv/imageClassification.ts#L5)

___

### ImageClassificationOutput

Ƭ **ImageClassificationOutput**: [`ImageClassificationOutputValue`](interfaces/ImageClassificationOutputValue)[]

#### Defined in

[tasks/cv/imageClassification.ts:23](https://github.com/huggingface/huggingface.js/blob/main/packages/inference/src/tasks/cv/imageClassification.ts#L23)

___

### ImageSegmentationArgs

Ƭ **ImageSegmentationArgs**: [`BaseArgs`](interfaces/BaseArgs) & { `data`: `Blob` \| `ArrayBuffer`  }

#### Defined in

[tasks/cv/imageSegmentation.ts:5](https://github.com/huggingface/huggingface.js/blob/main/packages/inference/src/tasks/cv/imageSegmentation.ts#L5)

___

### ImageSegmentationOutput

Ƭ **ImageSegmentationOutput**: [`ImageSegmentationOutputValue`](interfaces/ImageSegmentationOutputValue)[]

#### Defined in

[tasks/cv/imageSegmentation.ts:27](https://github.com/huggingface/huggingface.js/blob/main/packages/inference/src/tasks/cv/imageSegmentation.ts#L27)

___

### ImageToTextArgs

Ƭ **ImageToTextArgs**: [`BaseArgs`](interfaces/BaseArgs) & { `data`: `Blob` \| `ArrayBuffer`  }

#### Defined in

[tasks/cv/imageToText.ts:5](https://github.com/huggingface/huggingface.js/blob/main/packages/inference/src/tasks/cv/imageToText.ts#L5)

___

### ObjectDetectionArgs

Ƭ **ObjectDetectionArgs**: [`BaseArgs`](interfaces/BaseArgs) & { `data`: `Blob` \| `ArrayBuffer`  }

#### Defined in

[tasks/cv/objectDetection.ts:5](https://github.com/huggingface/huggingface.js/blob/main/packages/inference/src/tasks/cv/objectDetection.ts#L5)

___

### ObjectDetectionOutput

Ƭ **ObjectDetectionOutput**: [`ObjectDetectionOutputValue`](interfaces/ObjectDetectionOutputValue)[]

#### Defined in

[tasks/cv/objectDetection.ts:33](https://github.com/huggingface/huggingface.js/blob/main/packages/inference/src/tasks/cv/objectDetection.ts#L33)

___

### QuestionAnsweringArgs

Ƭ **QuestionAnsweringArgs**: [`BaseArgs`](interfaces/BaseArgs) & { `inputs`: { `context`: `string` ; `question`: `string`  }  }

#### Defined in

[tasks/nlp/questionAnswering.ts:5](https://github.com/huggingface/huggingface.js/blob/main/packages/inference/src/tasks/nlp/questionAnswering.ts#L5)

___

### RequestArgs

Ƭ **RequestArgs**: [`BaseArgs`](interfaces/BaseArgs) & { `data`: `Blob` \| `ArrayBuffer`  } \| { `inputs`: `unknown`  } & { `accessToken?`: `string` ; `parameters?`: `Record`<`string`, `unknown`\>  }

#### Defined in

[types.ts:38](https://github.com/huggingface/huggingface.js/blob/main/packages/inference/src/types.ts#L38)

___

### SentenceSimilarityArgs

Ƭ **SentenceSimilarityArgs**: [`BaseArgs`](interfaces/BaseArgs) & { `inputs`: `Record`<`string`, `unknown`\> \| `Record`<`string`, `unknown`\>[]  }

#### Defined in

[tasks/nlp/sentenceSimilarity.ts:5](https://github.com/huggingface/huggingface.js/blob/main/packages/inference/src/tasks/nlp/sentenceSimilarity.ts#L5)

___

### SentenceSimilarityOutput

Ƭ **SentenceSimilarityOutput**: `number`[]

Returned values are a list of floats

#### Defined in

[tasks/nlp/sentenceSimilarity.ts:18](https://github.com/huggingface/huggingface.js/blob/main/packages/inference/src/tasks/nlp/sentenceSimilarity.ts#L18)

___

### SummarizationArgs

Ƭ **SummarizationArgs**: [`BaseArgs`](interfaces/BaseArgs) & { `inputs`: `string` ; `parameters?`: { `max_length?`: `number` ; `max_time?`: `number` ; `min_length?`: `number` ; `repetition_penalty?`: `number` ; `temperature?`: `number` ; `top_k?`: `number` ; `top_p?`: `number`  }  }

#### Defined in

[tasks/nlp/summarization.ts:5](https://github.com/huggingface/huggingface.js/blob/main/packages/inference/src/tasks/nlp/summarization.ts#L5)

___

### TableQuestionAnsweringArgs

Ƭ **TableQuestionAnsweringArgs**: [`BaseArgs`](interfaces/BaseArgs) & { `inputs`: { `query`: `string` ; `table`: `Record`<`string`, `string`[]\>  }  }

#### Defined in

[tasks/nlp/tableQuestionAnswering.ts:5](https://github.com/huggingface/huggingface.js/blob/main/packages/inference/src/tasks/nlp/tableQuestionAnswering.ts#L5)

___

### TextClassificationArgs

Ƭ **TextClassificationArgs**: [`BaseArgs`](interfaces/BaseArgs) & { `inputs`: `string`  }

#### Defined in

[tasks/nlp/textClassification.ts:5](https://github.com/huggingface/huggingface.js/blob/main/packages/inference/src/tasks/nlp/textClassification.ts#L5)

___

### TextClassificationOutput

Ƭ **TextClassificationOutput**: { `label`: `string` ; `score`: `number`  }[]

#### Defined in

[tasks/nlp/textClassification.ts:12](https://github.com/huggingface/huggingface.js/blob/main/packages/inference/src/tasks/nlp/textClassification.ts#L12)

___

### TextGenerationArgs

Ƭ **TextGenerationArgs**: [`BaseArgs`](interfaces/BaseArgs) & { `inputs`: `string` ; `parameters?`: { `do_sample?`: `boolean` ; `max_new_tokens?`: `number` ; `max_time?`: `number` ; `num_return_sequences?`: `number` ; `repetition_penalty?`: `number` ; `return_full_text?`: `boolean` ; `temperature?`: `number` ; `top_k?`: `number` ; `top_p?`: `number`  }  }

#### Defined in

[tasks/nlp/textGeneration.ts:5](https://github.com/huggingface/huggingface.js/blob/main/packages/inference/src/tasks/nlp/textGeneration.ts#L5)

___

### TextGenerationStreamFinishReason

Ƭ **TextGenerationStreamFinishReason**: ``"length"`` \| ``"eos_token"`` \| ``"stop_sequence"``

#### Defined in

[tasks/nlp/textGenerationStream.ts:46](https://github.com/huggingface/huggingface.js/blob/main/packages/inference/src/tasks/nlp/textGenerationStream.ts#L46)

___

### TextToImageArgs

Ƭ **TextToImageArgs**: [`BaseArgs`](interfaces/BaseArgs) & { `inputs`: `string` ; `parameters?`: { `guidance_scale?`: `number` ; `height?`: `number` ; `negative_prompt?`: `string` ; `num_inference_steps?`: `number` ; `width?`: `number`  }  }

#### Defined in

[tasks/cv/textToImage.ts:5](https://github.com/huggingface/huggingface.js/blob/main/packages/inference/src/tasks/cv/textToImage.ts#L5)

___

### TextToImageOutput

Ƭ **TextToImageOutput**: `Blob`

#### Defined in

[tasks/cv/textToImage.ts:35](https://github.com/huggingface/huggingface.js/blob/main/packages/inference/src/tasks/cv/textToImage.ts#L35)

___

### TokenClassificationArgs

Ƭ **TokenClassificationArgs**: [`BaseArgs`](interfaces/BaseArgs) & { `inputs`: `string` ; `parameters?`: { `aggregation_strategy?`: ``"none"`` \| ``"simple"`` \| ``"first"`` \| ``"average"`` \| ``"max"``  }  }

#### Defined in

[tasks/nlp/tokenClassification.ts:6](https://github.com/huggingface/huggingface.js/blob/main/packages/inference/src/tasks/nlp/tokenClassification.ts#L6)

___

### TokenClassificationOutput

Ƭ **TokenClassificationOutput**: [`TokenClassificationOutputValue`](interfaces/TokenClassificationOutputValue)[]

#### Defined in

[tasks/nlp/tokenClassification.ts:52](https://github.com/huggingface/huggingface.js/blob/main/packages/inference/src/tasks/nlp/tokenClassification.ts#L52)

___

### TranslationArgs

Ƭ **TranslationArgs**: [`BaseArgs`](interfaces/BaseArgs) & { `inputs`: `string`  }

#### Defined in

[tasks/nlp/translation.ts:5](https://github.com/huggingface/huggingface.js/blob/main/packages/inference/src/tasks/nlp/translation.ts#L5)

___

### ZeroShotClassificationArgs

Ƭ **ZeroShotClassificationArgs**: [`BaseArgs`](interfaces/BaseArgs) & { `inputs`: `string` \| `string`[] ; `parameters`: { `candidate_labels`: `string`[] ; `multi_label?`: `boolean`  }  }

#### Defined in

[tasks/nlp/zeroShotClassification.ts:6](https://github.com/huggingface/huggingface.js/blob/main/packages/inference/src/tasks/nlp/zeroShotClassification.ts#L6)

___

### ZeroShotClassificationOutput

Ƭ **ZeroShotClassificationOutput**: [`ZeroShotClassificationOutputValue`](interfaces/ZeroShotClassificationOutputValue)[]

#### Defined in

[tasks/nlp/zeroShotClassification.ts:29](https://github.com/huggingface/huggingface.js/blob/main/packages/inference/src/tasks/nlp/zeroShotClassification.ts#L29)

## Functions

### audioClassification

▸ **audioClassification**(`args`, `options?`): `Promise`<[`AudioClassificationReturn`](modules#audioclassificationreturn)\>

This task reads some audio input and outputs the likelihood of classes.
Recommended model:  superb/hubert-large-superb-er

#### Parameters

| Name | Type |
| :------ | :------ |
| `args` | [`AudioClassificationArgs`](modules#audioclassificationargs) |
| `options?` | [`Options`](interfaces/Options) |

#### Returns

`Promise`<[`AudioClassificationReturn`](modules#audioclassificationreturn)\>

#### Defined in

[tasks/audio/audioClassification.ts:30](https://github.com/huggingface/huggingface.js/blob/main/packages/inference/src/tasks/audio/audioClassification.ts#L30)

___

### automaticSpeechRecognition

▸ **automaticSpeechRecognition**(`args`, `options?`): `Promise`<[`AutomaticSpeechRecognitionOutput`](interfaces/AutomaticSpeechRecognitionOutput)\>

This task reads some audio input and outputs the said words within the audio files.
Recommended model (english language): facebook/wav2vec2-large-960h-lv60-self

#### Parameters

| Name | Type |
| :------ | :------ |
| `args` | [`AutomaticSpeechRecognitionArgs`](modules#automaticspeechrecognitionargs) |
| `options?` | [`Options`](interfaces/Options) |

#### Returns

`Promise`<[`AutomaticSpeechRecognitionOutput`](interfaces/AutomaticSpeechRecognitionOutput)\>

#### Defined in

[tasks/audio/automaticSpeechRecognition.ts:23](https://github.com/huggingface/huggingface.js/blob/main/packages/inference/src/tasks/audio/automaticSpeechRecognition.ts#L23)

___

### conversational

▸ **conversational**(`args`, `options?`): `Promise`<[`ConversationalOutput`](interfaces/ConversationalOutput)\>

This task corresponds to any chatbot like structure. Models tend to have shorter max_length, so please check with caution when using a given model if you need long range dependency or not. Recommended model: microsoft/DialoGPT-large.

#### Parameters

| Name | Type |
| :------ | :------ |
| `args` | [`ConversationalArgs`](modules#conversationalargs) |
| `options?` | [`Options`](interfaces/Options) |

#### Returns

`Promise`<[`ConversationalOutput`](interfaces/ConversationalOutput)\>

#### Defined in

[tasks/nlp/conversational.ts:65](https://github.com/huggingface/huggingface.js/blob/main/packages/inference/src/tasks/nlp/conversational.ts#L65)

___

### featureExtraction

▸ **featureExtraction**(`args`, `options?`): `Promise`<[`FeatureExtractionOutput`](modules#featureextractionoutput)\>

This task reads some text and outputs raw float values, that are usually consumed as part of a semantic database/semantic search.

#### Parameters

| Name | Type |
| :------ | :------ |
| `args` | [`FeatureExtractionArgs`](modules#featureextractionargs) |
| `options?` | [`Options`](interfaces/Options) |

#### Returns

`Promise`<[`FeatureExtractionOutput`](modules#featureextractionoutput)\>

#### Defined in

[tasks/nlp/featureExtraction.ts:23](https://github.com/huggingface/huggingface.js/blob/main/packages/inference/src/tasks/nlp/featureExtraction.ts#L23)

___

### fillMask

▸ **fillMask**(`args`, `options?`): `Promise`<[`FillMaskOutput`](modules#fillmaskoutput)\>

Tries to fill in a hole with a missing word (token to be precise). That’s the base task for BERT models.

#### Parameters

| Name | Type |
| :------ | :------ |
| `args` | [`FillMaskArgs`](modules#fillmaskargs) |
| `options?` | [`Options`](interfaces/Options) |

#### Returns

`Promise`<[`FillMaskOutput`](modules#fillmaskoutput)\>

#### Defined in

[tasks/nlp/fillMask.ts:31](https://github.com/huggingface/huggingface.js/blob/main/packages/inference/src/tasks/nlp/fillMask.ts#L31)

___

### imageClassification

▸ **imageClassification**(`args`, `options?`): `Promise`<[`ImageClassificationOutput`](modules#imageclassificationoutput)\>

This task reads some image input and outputs the likelihood of classes.
Recommended model: google/vit-base-patch16-224

#### Parameters

| Name | Type |
| :------ | :------ |
| `args` | [`ImageClassificationArgs`](modules#imageclassificationargs) |
| `options?` | [`Options`](interfaces/Options) |

#### Returns

`Promise`<[`ImageClassificationOutput`](modules#imageclassificationoutput)\>

#### Defined in

[tasks/cv/imageClassification.ts:29](https://github.com/huggingface/huggingface.js/blob/main/packages/inference/src/tasks/cv/imageClassification.ts#L29)

___

### imageSegmentation

▸ **imageSegmentation**(`args`, `options?`): `Promise`<[`ImageSegmentationOutput`](modules#imagesegmentationoutput)\>

This task reads some image input and outputs the likelihood of classes & bounding boxes of detected objects.
Recommended model: facebook/detr-resnet-50-panoptic

#### Parameters

| Name | Type |
| :------ | :------ |
| `args` | [`ImageSegmentationArgs`](modules#imagesegmentationargs) |
| `options?` | [`Options`](interfaces/Options) |

#### Returns

`Promise`<[`ImageSegmentationOutput`](modules#imagesegmentationoutput)\>

#### Defined in

[tasks/cv/imageSegmentation.ts:33](https://github.com/huggingface/huggingface.js/blob/main/packages/inference/src/tasks/cv/imageSegmentation.ts#L33)

___

### imageToText

▸ **imageToText**(`args`, `options?`): `Promise`<[`ImageToTextOutput`](interfaces/ImageToTextOutput)\>

This task reads some image input and outputs the text caption.

#### Parameters

| Name | Type |
| :------ | :------ |
| `args` | [`ImageToTextArgs`](modules#imagetotextargs) |
| `options?` | [`Options`](interfaces/Options) |

#### Returns

`Promise`<[`ImageToTextOutput`](interfaces/ImageToTextOutput)\>

#### Defined in

[tasks/cv/imageToText.ts:22](https://github.com/huggingface/huggingface.js/blob/main/packages/inference/src/tasks/cv/imageToText.ts#L22)

___

### objectDetection

▸ **objectDetection**(`args`, `options?`): `Promise`<[`ObjectDetectionOutput`](modules#objectdetectionoutput)\>

This task reads some image input and outputs the likelihood of classes & bounding boxes of detected objects.
Recommended model: facebook/detr-resnet-50

#### Parameters

| Name | Type |
| :------ | :------ |
| `args` | [`ObjectDetectionArgs`](modules#objectdetectionargs) |
| `options?` | [`Options`](interfaces/Options) |

#### Returns

`Promise`<[`ObjectDetectionOutput`](modules#objectdetectionoutput)\>

#### Defined in

[tasks/cv/objectDetection.ts:39](https://github.com/huggingface/huggingface.js/blob/main/packages/inference/src/tasks/cv/objectDetection.ts#L39)

___

### questionAnswering

▸ **questionAnswering**(`args`, `options?`): `Promise`<[`QuestionAnsweringOutput`](interfaces/QuestionAnsweringOutput)\>

Want to have a nice know-it-all bot that can answer any question?. Recommended model: deepset/roberta-base-squad2

#### Parameters

| Name | Type |
| :------ | :------ |
| `args` | [`QuestionAnsweringArgs`](modules#questionansweringargs) |
| `options?` | [`Options`](interfaces/Options) |

#### Returns

`Promise`<[`QuestionAnsweringOutput`](interfaces/QuestionAnsweringOutput)\>

#### Defined in

[tasks/nlp/questionAnswering.ts:34](https://github.com/huggingface/huggingface.js/blob/main/packages/inference/src/tasks/nlp/questionAnswering.ts#L34)

___

### request

▸ **request**<`T`\>(`args`, `options?`): `Promise`<`T`\>

Primitive to make custom calls to the inference API

#### Type parameters

| Name |
| :------ |
| `T` |

#### Parameters

| Name | Type |
| :------ | :------ |
| `args` | [`RequestArgs`](modules#requestargs) |
| `options?` | [`Options`](interfaces/Options) & { `includeCredentials?`: `boolean`  } |

#### Returns

`Promise`<`T`\>

#### Defined in

[tasks/custom/request.ts:7](https://github.com/huggingface/huggingface.js/blob/main/packages/inference/src/tasks/custom/request.ts#L7)

___

### sentenceSimilarity

▸ **sentenceSimilarity**(`args`, `options?`): `Promise`<[`SentenceSimilarityOutput`](modules#sentencesimilarityoutput)\>

Calculate the semantic similarity between one text and a list of other sentences by comparing their embeddings.

#### Parameters

| Name | Type |
| :------ | :------ |
| `args` | [`SentenceSimilarityArgs`](modules#sentencesimilarityargs) |
| `options?` | [`Options`](interfaces/Options) |

#### Returns

`Promise`<[`SentenceSimilarityOutput`](modules#sentencesimilarityoutput)\>

#### Defined in

[tasks/nlp/sentenceSimilarity.ts:23](https://github.com/huggingface/huggingface.js/blob/main/packages/inference/src/tasks/nlp/sentenceSimilarity.ts#L23)

___

### streamingRequest

▸ **streamingRequest**<`T`\>(`args`, `options?`): `AsyncGenerator`<`T`\>

Primitive to make custom inference calls that expect server-sent events, and returns the response through a generator

#### Type parameters

| Name |
| :------ |
| `T` |

#### Parameters

| Name | Type |
| :------ | :------ |
| `args` | [`RequestArgs`](modules#requestargs) |
| `options?` | [`Options`](interfaces/Options) & { `includeCredentials?`: `boolean`  } |

#### Returns

`AsyncGenerator`<`T`\>

#### Defined in

[tasks/custom/streamingRequest.ts:9](https://github.com/huggingface/huggingface.js/blob/main/packages/inference/src/tasks/custom/streamingRequest.ts#L9)

___

### summarization

▸ **summarization**(`args`, `options?`): `Promise`<[`SummarizationOutput`](interfaces/SummarizationOutput)\>

This task is well known to summarize longer text into shorter text. Be careful, some models have a maximum length of input. That means that the summary cannot handle full books for instance. Be careful when choosing your model.

#### Parameters

| Name | Type |
| :------ | :------ |
| `args` | [`SummarizationArgs`](modules#summarizationargs) |
| `options?` | [`Options`](interfaces/Options) |

#### Returns

`Promise`<[`SummarizationOutput`](interfaces/SummarizationOutput)\>

#### Defined in

[tasks/nlp/summarization.ts:52](https://github.com/huggingface/huggingface.js/blob/main/packages/inference/src/tasks/nlp/summarization.ts#L52)

___

### tableQuestionAnswering

▸ **tableQuestionAnswering**(`args`, `options?`): `Promise`<[`TableQuestionAnsweringOutput`](interfaces/TableQuestionAnsweringOutput)\>

Don’t know SQL? Don’t want to dive into a large spreadsheet? Ask questions in plain english! Recommended model: google/tapas-base-finetuned-wtq.

#### Parameters

| Name | Type |
| :------ | :------ |
| `args` | [`TableQuestionAnsweringArgs`](modules#tablequestionansweringargs) |
| `options?` | [`Options`](interfaces/Options) |

#### Returns

`Promise`<[`TableQuestionAnsweringOutput`](interfaces/TableQuestionAnsweringOutput)\>

#### Defined in

[tasks/nlp/tableQuestionAnswering.ts:40](https://github.com/huggingface/huggingface.js/blob/main/packages/inference/src/tasks/nlp/tableQuestionAnswering.ts#L40)

___

### textClassification

▸ **textClassification**(`args`, `options?`): `Promise`<[`TextClassificationOutput`](modules#textclassificationoutput)\>

Usually used for sentiment-analysis this will output the likelihood of classes of an input. Recommended model: distilbert-base-uncased-finetuned-sst-2-english

#### Parameters

| Name | Type |
| :------ | :------ |
| `args` | [`TextClassificationArgs`](modules#textclassificationargs) |
| `options?` | [`Options`](interfaces/Options) |

#### Returns

`Promise`<[`TextClassificationOutput`](modules#textclassificationoutput)\>

#### Defined in

[tasks/nlp/textClassification.ts:26](https://github.com/huggingface/huggingface.js/blob/main/packages/inference/src/tasks/nlp/textClassification.ts#L26)

___

### textGeneration

▸ **textGeneration**(`args`, `options?`): `Promise`<[`TextGenerationOutput`](interfaces/TextGenerationOutput)\>

Use to continue text from a prompt. This is a very generic task. Recommended model: gpt2 (it’s a simple model, but fun to play with).

#### Parameters

| Name | Type |
| :------ | :------ |
| `args` | [`TextGenerationArgs`](modules#textgenerationargs) |
| `options?` | [`Options`](interfaces/Options) |

#### Returns

`Promise`<[`TextGenerationOutput`](interfaces/TextGenerationOutput)\>

#### Defined in

[tasks/nlp/textGeneration.ts:60](https://github.com/huggingface/huggingface.js/blob/main/packages/inference/src/tasks/nlp/textGeneration.ts#L60)

___

### textGenerationStream

▸ **textGenerationStream**(`args`, `options?`): `AsyncGenerator`<[`TextGenerationStreamOutput`](interfaces/TextGenerationStreamOutput)\>

Use to continue text from a prompt. Same as `textGeneration` but returns generator that can be read one token at a time

#### Parameters

| Name | Type |
| :------ | :------ |
| `args` | [`TextGenerationArgs`](modules#textgenerationargs) |
| `options?` | [`Options`](interfaces/Options) |

#### Returns

`AsyncGenerator`<[`TextGenerationStreamOutput`](interfaces/TextGenerationStreamOutput)\>

#### Defined in

[tasks/nlp/textGenerationStream.ts:87](https://github.com/huggingface/huggingface.js/blob/main/packages/inference/src/tasks/nlp/textGenerationStream.ts#L87)

___

### textToImage

▸ **textToImage**(`args`, `options?`): `Promise`<[`TextToImageOutput`](modules#texttoimageoutput)\>

This task reads some text input and outputs an image.
Recommended model: stabilityai/stable-diffusion-2

#### Parameters

| Name | Type |
| :------ | :------ |
| `args` | [`TextToImageArgs`](modules#texttoimageargs) |
| `options?` | [`Options`](interfaces/Options) |

#### Returns

`Promise`<[`TextToImageOutput`](modules#texttoimageoutput)\>

#### Defined in

[tasks/cv/textToImage.ts:41](https://github.com/huggingface/huggingface.js/blob/main/packages/inference/src/tasks/cv/textToImage.ts#L41)

___

### tokenClassification

▸ **tokenClassification**(`args`, `options?`): `Promise`<[`TokenClassificationOutput`](modules#tokenclassificationoutput)\>

Usually used for sentence parsing, either grammatical, or Named Entity Recognition (NER) to understand keywords contained within text. Recommended model: dbmdz/bert-large-cased-finetuned-conll03-english

#### Parameters

| Name | Type |
| :------ | :------ |
| `args` | [`TokenClassificationArgs`](modules#tokenclassificationargs) |
| `options?` | [`Options`](interfaces/Options) |

#### Returns

`Promise`<[`TokenClassificationOutput`](modules#tokenclassificationoutput)\>

#### Defined in

[tasks/nlp/tokenClassification.ts:57](https://github.com/huggingface/huggingface.js/blob/main/packages/inference/src/tasks/nlp/tokenClassification.ts#L57)

___

### translation

▸ **translation**(`args`, `options?`): `Promise`<[`TranslationOutput`](interfaces/TranslationOutput)\>

This task is well known to translate text from one language to another. Recommended model: Helsinki-NLP/opus-mt-ru-en.

#### Parameters

| Name | Type |
| :------ | :------ |
| `args` | [`TranslationArgs`](modules#translationargs) |
| `options?` | [`Options`](interfaces/Options) |

#### Returns

`Promise`<[`TranslationOutput`](interfaces/TranslationOutput)\>

#### Defined in

[tasks/nlp/translation.ts:22](https://github.com/huggingface/huggingface.js/blob/main/packages/inference/src/tasks/nlp/translation.ts#L22)

___

### zeroShotClassification

▸ **zeroShotClassification**(`args`, `options?`): `Promise`<[`ZeroShotClassificationOutput`](modules#zeroshotclassificationoutput)\>

This task is super useful to try out classification with zero code, you simply pass a sentence/paragraph and the possible labels for that sentence, and you get a result. Recommended model: facebook/bart-large-mnli.

#### Parameters

| Name | Type |
| :------ | :------ |
| `args` | [`ZeroShotClassificationArgs`](modules#zeroshotclassificationargs) |
| `options?` | [`Options`](interfaces/Options) |

#### Returns

`Promise`<[`ZeroShotClassificationOutput`](modules#zeroshotclassificationoutput)\>

#### Defined in

[tasks/nlp/zeroShotClassification.ts:34](https://github.com/huggingface/huggingface.js/blob/main/packages/inference/src/tasks/nlp/zeroShotClassification.ts#L34)
