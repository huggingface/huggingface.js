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

[HfInference.ts:513](https://github.com/huggingface/huggingface.js/blob/main/packages/inference/src/HfInference.ts#L513)

## Properties

### apiKey

• `Private` `Readonly` **apiKey**: `string`

#### Defined in

[HfInference.ts:510](https://github.com/huggingface/huggingface.js/blob/main/packages/inference/src/HfInference.ts#L510)

___

### defaultOptions

• `Private` `Readonly` **defaultOptions**: [`Options`](../interfaces/Options)

#### Defined in

[HfInference.ts:511](https://github.com/huggingface/huggingface.js/blob/main/packages/inference/src/HfInference.ts#L511)

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

[HfInference.ts:737](https://github.com/huggingface/huggingface.js/blob/main/packages/inference/src/HfInference.ts#L737)

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

[HfInference.ts:718](https://github.com/huggingface/huggingface.js/blob/main/packages/inference/src/HfInference.ts#L718)

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

[HfInference.ts:688](https://github.com/huggingface/huggingface.js/blob/main/packages/inference/src/HfInference.ts#L688)

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

[HfInference.ts:709](https://github.com/huggingface/huggingface.js/blob/main/packages/inference/src/HfInference.ts#L709)

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

[HfInference.ts:521](https://github.com/huggingface/huggingface.js/blob/main/packages/inference/src/HfInference.ts#L521)

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

[HfInference.ts:757](https://github.com/huggingface/huggingface.js/blob/main/packages/inference/src/HfInference.ts#L757)

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

[HfInference.ts:805](https://github.com/huggingface/huggingface.js/blob/main/packages/inference/src/HfInference.ts#L805)

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

[HfInference.ts:777](https://github.com/huggingface/huggingface.js/blob/main/packages/inference/src/HfInference.ts#L777)

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

[HfInference.ts:555](https://github.com/huggingface/huggingface.js/blob/main/packages/inference/src/HfInference.ts#L555)

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

[HfInference.ts:837](https://github.com/huggingface/huggingface.js/blob/main/packages/inference/src/HfInference.ts#L837)

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

[HfInference.ts:543](https://github.com/huggingface/huggingface.js/blob/main/packages/inference/src/HfInference.ts#L543)

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

[HfInference.ts:573](https://github.com/huggingface/huggingface.js/blob/main/packages/inference/src/HfInference.ts#L573)

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

[HfInference.ts:596](https://github.com/huggingface/huggingface.js/blob/main/packages/inference/src/HfInference.ts#L596)

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

[HfInference.ts:609](https://github.com/huggingface/huggingface.js/blob/main/packages/inference/src/HfInference.ts#L609)

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

[HfInference.ts:825](https://github.com/huggingface/huggingface.js/blob/main/packages/inference/src/HfInference.ts#L825)

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

[HfInference.ts:621](https://github.com/huggingface/huggingface.js/blob/main/packages/inference/src/HfInference.ts#L621)

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

[HfInference.ts:647](https://github.com/huggingface/huggingface.js/blob/main/packages/inference/src/HfInference.ts#L647)

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

[HfInference.ts:659](https://github.com/huggingface/huggingface.js/blob/main/packages/inference/src/HfInference.ts#L659)
