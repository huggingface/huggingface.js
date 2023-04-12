# Class: HfInference

## Constructors

### constructor

• **new HfInference**(`apiKey?`, `defaultOptions?`)

#### Parameters

| Name | Type | Default value |
| :------ | :------ | :------ |
| `apiKey` | `string` | `""` |
| `defaultOptions` | [`Options`](../interfaces/Options) | `{}` |

#### Defined in

[HfInference.ts:629](https://github.com/huggingface/huggingface.js/blob/main/packages/inference/src/HfInference.ts#L629)

## Properties

### apiKey

• `Private` `Readonly` **apiKey**: `string`

#### Defined in

[HfInference.ts:626](https://github.com/huggingface/huggingface.js/blob/main/packages/inference/src/HfInference.ts#L626)

___

### defaultOptions

• `Private` `Readonly` **defaultOptions**: [`Options`](../interfaces/Options)

#### Defined in

[HfInference.ts:627](https://github.com/huggingface/huggingface.js/blob/main/packages/inference/src/HfInference.ts#L627)

## Methods

### audioClassification

▸ **audioClassification**(`args`, `options?`): `Promise`<[`AudioClassificationReturn`](../modules#audioclassificationreturn)\>

This task reads some audio input and outputs the likelihood of classes.
Recommended model:  superb/hubert-large-superb-er

#### Parameters

| Name | Type |
| :------ | :------ |
| `args` | [`AudioClassificationArgs`](../modules#audioclassificationargs) |
| `options?` | [`Options`](../interfaces/Options) |

#### Returns

`Promise`<[`AudioClassificationReturn`](../modules#audioclassificationreturn)\>

#### Defined in

[HfInference.ts:863](https://github.com/huggingface/huggingface.js/blob/main/packages/inference/src/HfInference.ts#L863)

___

### automaticSpeechRecognition

▸ **automaticSpeechRecognition**(`args`, `options?`): `Promise`<[`AutomaticSpeechRecognitionReturn`](../interfaces/AutomaticSpeechRecognitionReturn)\>

This task reads some audio input and outputs the said words within the audio files.
Recommended model (english language): facebook/wav2vec2-large-960h-lv60-self

#### Parameters

| Name | Type |
| :------ | :------ |
| `args` | [`AutomaticSpeechRecognitionArgs`](../modules#automaticspeechrecognitionargs) |
| `options?` | [`Options`](../interfaces/Options) |

#### Returns

`Promise`<[`AutomaticSpeechRecognitionReturn`](../interfaces/AutomaticSpeechRecognitionReturn)\>

#### Defined in

[HfInference.ts:844](https://github.com/huggingface/huggingface.js/blob/main/packages/inference/src/HfInference.ts#L844)

___

### conversational

▸ **conversational**(`args`, `options?`): `Promise`<[`ConversationalReturn`](../interfaces/ConversationalReturn)\>

This task corresponds to any chatbot like structure. Models tend to have shorter max_length, so please check with caution when using a given model if you need long range dependency or not. Recommended model: microsoft/DialoGPT-large.

#### Parameters

| Name | Type |
| :------ | :------ |
| `args` | [`ConversationalArgs`](../modules#conversationalargs) |
| `options?` | [`Options`](../interfaces/Options) |

#### Returns

`Promise`<[`ConversationalReturn`](../interfaces/ConversationalReturn)\>

#### Defined in

[HfInference.ts:814](https://github.com/huggingface/huggingface.js/blob/main/packages/inference/src/HfInference.ts#L814)

___

### featureExtraction

▸ **featureExtraction**(`args`, `options?`): `Promise`<[`FeatureExtractionReturn`](../modules#featureextractionreturn)\>

This task reads some text and outputs raw float values, that are usually consumed as part of a semantic database/semantic search.

#### Parameters

| Name | Type |
| :------ | :------ |
| `args` | [`FeatureExtractionArgs`](../modules#featureextractionargs) |
| `options?` | [`Options`](../interfaces/Options) |

#### Returns

`Promise`<[`FeatureExtractionReturn`](../modules#featureextractionreturn)\>

#### Defined in

[HfInference.ts:835](https://github.com/huggingface/huggingface.js/blob/main/packages/inference/src/HfInference.ts#L835)

___

### fillMask

▸ **fillMask**(`args`, `options?`): `Promise`<[`FillMaskReturn`](../modules#fillmaskreturn)\>

Tries to fill in a hole with a missing word (token to be precise). That’s the base task for BERT models.

#### Parameters

| Name | Type |
| :------ | :------ |
| `args` | [`FillMaskArgs`](../modules#fillmaskargs) |
| `options?` | [`Options`](../interfaces/Options) |

#### Returns

`Promise`<[`FillMaskReturn`](../modules#fillmaskreturn)\>

#### Defined in

[HfInference.ts:637](https://github.com/huggingface/huggingface.js/blob/main/packages/inference/src/HfInference.ts#L637)

___

### imageClassification

▸ **imageClassification**(`args`, `options?`): `Promise`<[`ImageClassificationReturn`](../modules#imageclassificationreturn)\>

This task reads some image input and outputs the likelihood of classes.
Recommended model: google/vit-base-patch16-224

#### Parameters

| Name | Type |
| :------ | :------ |
| `args` | [`ImageClassificationArgs`](../modules#imageclassificationargs) |
| `options?` | [`Options`](../interfaces/Options) |

#### Returns

`Promise`<[`ImageClassificationReturn`](../modules#imageclassificationreturn)\>

#### Defined in

[HfInference.ts:883](https://github.com/huggingface/huggingface.js/blob/main/packages/inference/src/HfInference.ts#L883)

___

### imageSegmentation

▸ **imageSegmentation**(`args`, `options?`): `Promise`<[`ImageSegmentationReturn`](../modules#imagesegmentationreturn)\>

This task reads some image input and outputs the likelihood of classes & bounding boxes of detected objects.
Recommended model: facebook/detr-resnet-50-panoptic

#### Parameters

| Name | Type |
| :------ | :------ |
| `args` | [`ImageSegmentationArgs`](../modules#imagesegmentationargs) |
| `options?` | [`Options`](../interfaces/Options) |

#### Returns

`Promise`<[`ImageSegmentationReturn`](../modules#imagesegmentationreturn)\>

#### Defined in

[HfInference.ts:931](https://github.com/huggingface/huggingface.js/blob/main/packages/inference/src/HfInference.ts#L931)

___

### imageToText

▸ **imageToText**(`args`, `options?`): `Promise`<[`ImageToTextReturn`](../interfaces/ImageToTextReturn)\>

This task reads some image input and outputs the text caption.

#### Parameters

| Name | Type |
| :------ | :------ |
| `args` | [`ImageToTextArgs`](../modules#imagetotextargs) |
| `options?` | [`Options`](../interfaces/Options) |

#### Returns

`Promise`<[`ImageToTextReturn`](../interfaces/ImageToTextReturn)\>

#### Defined in

[HfInference.ts:966](https://github.com/huggingface/huggingface.js/blob/main/packages/inference/src/HfInference.ts#L966)

___

### makeRequestOptions

▸ `Private` **makeRequestOptions**(`args`, `options?`): `Object`

Helper that prepares request arguments

#### Parameters

| Name | Type |
| :------ | :------ |
| `args` | [`Args`](../interfaces/Args) & { `data?`: `ArrayBuffer` \| `Blob` ; `stream?`: `boolean`  } |
| `options?` | [`Options`](../interfaces/Options) & { `binary?`: `boolean` ; `blob?`: `boolean` ; `includeCredentials?`: `boolean`  } |

#### Returns

`Object`

| Name | Type |
| :------ | :------ |
| `info` | `RequestInit` |
| `mergedOptions` | { `binary?`: `boolean` ; `blob?`: `boolean` ; `dont_load_model?`: `boolean` ; `includeCredentials?`: `boolean` ; `retry_on_error?`: `boolean` ; `use_cache?`: `boolean` ; `use_gpu?`: `boolean` ; `wait_for_model?`: `boolean`  } |
| `mergedOptions.binary?` | `boolean` |
| `mergedOptions.blob?` | `boolean` |
| `mergedOptions.dont_load_model?` | `boolean` |
| `mergedOptions.includeCredentials?` | `boolean` |
| `mergedOptions.retry_on_error?` | `boolean` |
| `mergedOptions.use_cache?` | `boolean` |
| `mergedOptions.use_gpu?` | `boolean` |
| `mergedOptions.wait_for_model?` | `boolean` |
| `url` | `string` |

#### Defined in

[HfInference.ts:978](https://github.com/huggingface/huggingface.js/blob/main/packages/inference/src/HfInference.ts#L978)

___

### objectDetection

▸ **objectDetection**(`args`, `options?`): `Promise`<[`ObjectDetectionReturn`](../modules#objectdetectionreturn)\>

This task reads some image input and outputs the likelihood of classes & bounding boxes of detected objects.
Recommended model: facebook/detr-resnet-50

#### Parameters

| Name | Type |
| :------ | :------ |
| `args` | [`ObjectDetectionArgs`](../modules#objectdetectionargs) |
| `options?` | [`Options`](../interfaces/Options) |

#### Returns

`Promise`<[`ObjectDetectionReturn`](../modules#objectdetectionreturn)\>

#### Defined in

[HfInference.ts:903](https://github.com/huggingface/huggingface.js/blob/main/packages/inference/src/HfInference.ts#L903)

___

### questionAnswer

▸ **questionAnswer**(`args`, `options?`): `Promise`<[`QuestionAnswerReturn`](../interfaces/QuestionAnswerReturn)\>

Want to have a nice know-it-all bot that can answer any question?. Recommended model: deepset/roberta-base-squad2

#### Parameters

| Name | Type |
| :------ | :------ |
| `args` | [`QuestionAnswerArgs`](../modules#questionanswerargs) |
| `options?` | [`Options`](../interfaces/Options) |

#### Returns

`Promise`<[`QuestionAnswerReturn`](../interfaces/QuestionAnswerReturn)\>

#### Defined in

[HfInference.ts:671](https://github.com/huggingface/huggingface.js/blob/main/packages/inference/src/HfInference.ts#L671)

___

### request

▸ **request**<`T`\>(`args`, `options?`): `Promise`<`T`\>

#### Type parameters

| Name |
| :------ |
| `T` |

#### Parameters

| Name | Type |
| :------ | :------ |
| `args` | [`Args`](../interfaces/Args) & { `data?`: `ArrayBuffer` \| `Blob`  } |
| `options?` | [`Options`](../interfaces/Options) & { `binary?`: `boolean` ; `blob?`: `boolean` ; `includeCredentials?`: `boolean`  } |

#### Returns

`Promise`<`T`\>

#### Defined in

[HfInference.ts:1030](https://github.com/huggingface/huggingface.js/blob/main/packages/inference/src/HfInference.ts#L1030)

___

### streamingRequest

▸ **streamingRequest**<`T`\>(`args`, `options?`): `AsyncGenerator`<`T`, `any`, `unknown`\>

Make request that uses server-sent events and returns response as a generator

#### Type parameters

| Name |
| :------ |
| `T` |

#### Parameters

| Name | Type |
| :------ | :------ |
| `args` | [`Args`](../interfaces/Args) & { `data?`: `ArrayBuffer` \| `Blob`  } |
| `options?` | [`Options`](../interfaces/Options) & { `binary?`: `boolean` ; `blob?`: `boolean` ; `includeCredentials?`: `boolean`  } |

#### Returns

`AsyncGenerator`<`T`, `any`, `unknown`\>

#### Defined in

[HfInference.ts:1066](https://github.com/huggingface/huggingface.js/blob/main/packages/inference/src/HfInference.ts#L1066)

___

### summarization

▸ **summarization**(`args`, `options?`): `Promise`<[`SummarizationReturn`](../interfaces/SummarizationReturn)\>

This task is well known to summarize longer text into shorter text. Be careful, some models have a maximum length of input. That means that the summary cannot handle full books for instance. Be careful when choosing your model.

#### Parameters

| Name | Type |
| :------ | :------ |
| `args` | [`SummarizationArgs`](../modules#summarizationargs) |
| `options?` | [`Options`](../interfaces/Options) |

#### Returns

`Promise`<[`SummarizationReturn`](../interfaces/SummarizationReturn)\>

#### Defined in

[HfInference.ts:659](https://github.com/huggingface/huggingface.js/blob/main/packages/inference/src/HfInference.ts#L659)

___

### tableQuestionAnswer

▸ **tableQuestionAnswer**(`args`, `options?`): `Promise`<[`TableQuestionAnswerReturn`](../interfaces/TableQuestionAnswerReturn)\>

Don’t know SQL? Don’t want to dive into a large spreadsheet? Ask questions in plain english! Recommended model: google/tapas-base-finetuned-wtq.

#### Parameters

| Name | Type |
| :------ | :------ |
| `args` | [`TableQuestionAnswerArgs`](../modules#tablequestionanswerargs) |
| `options?` | [`Options`](../interfaces/Options) |

#### Returns

`Promise`<[`TableQuestionAnswerReturn`](../interfaces/TableQuestionAnswerReturn)\>

#### Defined in

[HfInference.ts:689](https://github.com/huggingface/huggingface.js/blob/main/packages/inference/src/HfInference.ts#L689)

___

### textClassification

▸ **textClassification**(`args`, `options?`): `Promise`<[`TextClassificationReturn`](../modules#textclassificationreturn)\>

Usually used for sentiment-analysis this will output the likelihood of classes of an input. Recommended model: distilbert-base-uncased-finetuned-sst-2-english

#### Parameters

| Name | Type |
| :------ | :------ |
| `args` | [`TextClassificationArgs`](../modules#textclassificationargs) |
| `options?` | [`Options`](../interfaces/Options) |

#### Returns

`Promise`<[`TextClassificationReturn`](../modules#textclassificationreturn)\>

#### Defined in

[HfInference.ts:712](https://github.com/huggingface/huggingface.js/blob/main/packages/inference/src/HfInference.ts#L712)

___

### textGeneration

▸ **textGeneration**(`args`, `options?`): `Promise`<[`TextGenerationReturn`](../interfaces/TextGenerationReturn)\>

Use to continue text from a prompt. This is a very generic task. Recommended model: gpt2 (it’s a simple model, but fun to play with).

#### Parameters

| Name | Type |
| :------ | :------ |
| `args` | [`TextGenerationArgs`](../modules#textgenerationargs) |
| `options?` | [`Options`](../interfaces/Options) |

#### Returns

`Promise`<[`TextGenerationReturn`](../interfaces/TextGenerationReturn)\>

#### Defined in

[HfInference.ts:725](https://github.com/huggingface/huggingface.js/blob/main/packages/inference/src/HfInference.ts#L725)

___

### textGenerationStream

▸ **textGenerationStream**(`args`, `options?`): `AsyncGenerator`<[`TextGenerationStreamReturn`](../interfaces/TextGenerationStreamReturn), `any`, `unknown`\>

Use to continue text from a prompt. Same as `textGeneration` but returns generator that can be read one token at a time

#### Parameters

| Name | Type |
| :------ | :------ |
| `args` | [`TextGenerationArgs`](../modules#textgenerationargs) |
| `options?` | [`Options`](../interfaces/Options) |

#### Returns

`AsyncGenerator`<[`TextGenerationStreamReturn`](../interfaces/TextGenerationStreamReturn), `any`, `unknown`\>

#### Defined in

[HfInference.ts:737](https://github.com/huggingface/huggingface.js/blob/main/packages/inference/src/HfInference.ts#L737)

___

### textToImage

▸ **textToImage**(`args`, `options?`): `Promise`<`Blob`\>

This task reads some text input and outputs an image.
Recommended model: stabilityai/stable-diffusion-2

#### Parameters

| Name | Type |
| :------ | :------ |
| `args` | [`TextToImageArgs`](../modules#texttoimageargs) |
| `options?` | [`Options`](../interfaces/Options) |

#### Returns

`Promise`<`Blob`\>

#### Defined in

[HfInference.ts:951](https://github.com/huggingface/huggingface.js/blob/main/packages/inference/src/HfInference.ts#L951)

___

### tokenClassification

▸ **tokenClassification**(`args`, `options?`): `Promise`<[`TokenClassificationReturn`](../modules#tokenclassificationreturn)\>

Usually used for sentence parsing, either grammatical, or Named Entity Recognition (NER) to understand keywords contained within text. Recommended model: dbmdz/bert-large-cased-finetuned-conll03-english

#### Parameters

| Name | Type |
| :------ | :------ |
| `args` | [`TokenClassificationArgs`](../modules#tokenclassificationargs) |
| `options?` | [`Options`](../interfaces/Options) |

#### Returns

`Promise`<[`TokenClassificationReturn`](../modules#tokenclassificationreturn)\>

#### Defined in

[HfInference.ts:747](https://github.com/huggingface/huggingface.js/blob/main/packages/inference/src/HfInference.ts#L747)

___

### translation

▸ **translation**(`args`, `options?`): `Promise`<[`TranslationReturn`](../interfaces/TranslationReturn)\>

This task is well known to translate text from one language to another. Recommended model: Helsinki-NLP/opus-mt-ru-en.

#### Parameters

| Name | Type |
| :------ | :------ |
| `args` | [`TranslationArgs`](../modules#translationargs) |
| `options?` | [`Options`](../interfaces/Options) |

#### Returns

`Promise`<[`TranslationReturn`](../interfaces/TranslationReturn)\>

#### Defined in

[HfInference.ts:773](https://github.com/huggingface/huggingface.js/blob/main/packages/inference/src/HfInference.ts#L773)

___

### zeroShotClassification

▸ **zeroShotClassification**(`args`, `options?`): `Promise`<[`ZeroShotClassificationReturn`](../modules#zeroshotclassificationreturn)\>

This task is super useful to try out classification with zero code, you simply pass a sentence/paragraph and the possible labels for that sentence, and you get a result. Recommended model: facebook/bart-large-mnli.

#### Parameters

| Name | Type |
| :------ | :------ |
| `args` | [`ZeroShotClassificationArgs`](../modules#zeroshotclassificationargs) |
| `options?` | [`Options`](../interfaces/Options) |

#### Returns

`Promise`<[`ZeroShotClassificationReturn`](../modules#zeroshotclassificationreturn)\>

#### Defined in

[HfInference.ts:785](https://github.com/huggingface/huggingface.js/blob/main/packages/inference/src/HfInference.ts#L785)
