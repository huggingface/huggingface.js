# Class: HfInference

## Constructors

### constructor

• **new HfInference**(`apiKey?`, `defaultOptions?`)

#### Parameters

| Name | Type | Default value |
| :------ | :------ | :------ |
| `apiKey` | `string` | `""` |
| `defaultOptions` | [`Options`](../modules.md#options) | `{}` |

#### Defined in

[HfInference.ts:507](https://github.com/huggingface/huggingface.js/blob/main/packages/inference/src/HfInference.ts#L507)

## Properties

### apiKey

• `Private` `Readonly` **apiKey**: `string`

#### Defined in

[HfInference.ts:504](https://github.com/huggingface/huggingface.js/blob/main/packages/inference/src/HfInference.ts#L504)

___

### defaultOptions

• `Private` `Readonly` **defaultOptions**: [`Options`](../modules.md#options)

#### Defined in

[HfInference.ts:505](https://github.com/huggingface/huggingface.js/blob/main/packages/inference/src/HfInference.ts#L505)

## Methods

### audioClassification

▸ **audioClassification**(`args`, `options?`): `Promise`<[`AudioClassificationReturn`](../modules.md#audioclassificationreturn)\>

This task reads some audio input and outputs the likelihood of classes.
Recommended model:  superb/hubert-large-superb-er

#### Parameters

| Name | Type |
| :------ | :------ |
| `args` | [`AudioClassificationArgs`](../modules.md#audioclassificationargs) |
| `options?` | [`Options`](../modules.md#options) |

#### Returns

`Promise`<[`AudioClassificationReturn`](../modules.md#audioclassificationreturn)\>

#### Defined in

[HfInference.ts:617](https://github.com/huggingface/huggingface.js/blob/main/packages/inference/src/HfInference.ts#L617)

___

### automaticSpeechRecognition

▸ **automaticSpeechRecognition**(`args`, `options?`): `Promise`<[`AutomaticSpeechRecognitionReturn`](../modules.md#automaticspeechrecognitionreturn)\>

This task reads some audio input and outputs the said words within the audio files.
Recommended model (english language): facebook/wav2vec2-large-960h-lv60-self

#### Parameters

| Name | Type |
| :------ | :------ |
| `args` | [`AutomaticSpeechRecognitionArgs`](../modules.md#automaticspeechrecognitionargs) |
| `options?` | [`Options`](../modules.md#options) |

#### Returns

`Promise`<[`AutomaticSpeechRecognitionReturn`](../modules.md#automaticspeechrecognitionreturn)\>

#### Defined in

[HfInference.ts:603](https://github.com/huggingface/huggingface.js/blob/main/packages/inference/src/HfInference.ts#L603)

___

### conversational

▸ **conversational**(`args`, `options?`): `Promise`<[`ConversationalReturn`](../modules.md#conversationalreturn)\>

This task corresponds to any chatbot like structure. Models tend to have shorter max_length, so please check with caution when using a given model if you need long range dependency or not. Recommended model: microsoft/DialoGPT-large.

#### Parameters

| Name | Type |
| :------ | :------ |
| `args` | [`ConversationalArgs`](../modules.md#conversationalargs) |
| `options?` | [`Options`](../modules.md#options) |

#### Returns

`Promise`<[`ConversationalReturn`](../modules.md#conversationalreturn)\>

#### Defined in

[HfInference.ts:588](https://github.com/huggingface/huggingface.js/blob/main/packages/inference/src/HfInference.ts#L588)

___

### featureExtraction

▸ **featureExtraction**(`args`, `options?`): `Promise`<[`FeatureExtractionReturn`](../modules.md#featureextractionreturn)\>

This task reads some text and outputs raw float values, that are usually consumed as part of a semantic database/semantic search.

#### Parameters

| Name | Type |
| :------ | :------ |
| `args` | [`FeatureExtractionArgs`](../modules.md#featureextractionargs) |
| `options?` | [`Options`](../modules.md#options) |

#### Returns

`Promise`<[`FeatureExtractionReturn`](../modules.md#featureextractionreturn)\>

#### Defined in

[HfInference.ts:595](https://github.com/huggingface/huggingface.js/blob/main/packages/inference/src/HfInference.ts#L595)

___

### fillMask

▸ **fillMask**(`args`, `options?`): `Promise`<[`FillMaskReturn`](../modules.md#fillmaskreturn)\>

Tries to fill in a hole with a missing word (token to be precise). That’s the base task for BERT models.

#### Parameters

| Name | Type |
| :------ | :------ |
| `args` | [`FillMaskArgs`](../modules.md#fillmaskargs) |
| `options?` | [`Options`](../modules.md#options) |

#### Returns

`Promise`<[`FillMaskReturn`](../modules.md#fillmaskreturn)\>

#### Defined in

[HfInference.ts:515](https://github.com/huggingface/huggingface.js/blob/main/packages/inference/src/HfInference.ts#L515)

___

### imageClassification

▸ **imageClassification**(`args`, `options?`): `Promise`<[`ImageClassificationReturn`](../modules.md#imageclassificationreturn)\>

This task reads some image input and outputs the likelihood of classes.
Recommended model: google/vit-base-patch16-224

#### Parameters

| Name | Type |
| :------ | :------ |
| `args` | [`ImageClassificationArgs`](../modules.md#imageclassificationargs) |
| `options?` | [`Options`](../modules.md#options) |

#### Returns

`Promise`<[`ImageClassificationReturn`](../modules.md#imageclassificationreturn)\>

#### Defined in

[HfInference.ts:631](https://github.com/huggingface/huggingface.js/blob/main/packages/inference/src/HfInference.ts#L631)

___

### imageSegmentation

▸ **imageSegmentation**(`args`, `options?`): `Promise`<[`ImageSegmentationReturn`](../modules.md#imagesegmentationreturn)\>

This task reads some image input and outputs the likelihood of classes & bounding boxes of detected objects.
Recommended model: facebook/detr-resnet-50-panoptic

#### Parameters

| Name | Type |
| :------ | :------ |
| `args` | [`ImageSegmentationArgs`](../modules.md#imagesegmentationargs) |
| `options?` | [`Options`](../modules.md#options) |

#### Returns

`Promise`<[`ImageSegmentationReturn`](../modules.md#imagesegmentationreturn)\>

#### Defined in

[HfInference.ts:656](https://github.com/huggingface/huggingface.js/blob/main/packages/inference/src/HfInference.ts#L656)

___

### objectDetection

▸ **objectDetection**(`args`, `options?`): `Promise`<[`ObjectDetectionReturn`](../modules.md#objectdetectionreturn)\>

This task reads some image input and outputs the likelihood of classes & bounding boxes of detected objects.
Recommended model: facebook/detr-resnet-50

#### Parameters

| Name | Type |
| :------ | :------ |
| `args` | [`ObjectDetectionArgs`](../modules.md#objectdetectionargs) |
| `options?` | [`Options`](../modules.md#options) |

#### Returns

`Promise`<[`ObjectDetectionReturn`](../modules.md#objectdetectionreturn)\>

#### Defined in

[HfInference.ts:645](https://github.com/huggingface/huggingface.js/blob/main/packages/inference/src/HfInference.ts#L645)

___

### questionAnswer

▸ **questionAnswer**(`args`, `options?`): `Promise`<[`QuestionAnswerReturn`](../modules.md#questionanswerreturn)\>

Want to have a nice know-it-all bot that can answer any question?. Recommended model: deepset/roberta-base-squad2

#### Parameters

| Name | Type |
| :------ | :------ |
| `args` | [`QuestionAnswerArgs`](../modules.md#questionanswerargs) |
| `options?` | [`Options`](../modules.md#options) |

#### Returns

`Promise`<[`QuestionAnswerReturn`](../modules.md#questionanswerreturn)\>

#### Defined in

[HfInference.ts:529](https://github.com/huggingface/huggingface.js/blob/main/packages/inference/src/HfInference.ts#L529)

___

### request

▸ **request**(`args`, `options?`): `Promise`<`any`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `args` | [`Args`](../modules.md#args) & { `data?`: `any`  } |
| `options?` | [`Options`](../modules.md#options) & { `binary?`: `boolean` ; `blob?`: `boolean`  } |

#### Returns

`Promise`<`any`\>

#### Defined in

[HfInference.ts:674](https://github.com/huggingface/huggingface.js/blob/main/packages/inference/src/HfInference.ts#L674)

___

### summarization

▸ **summarization**(`args`, `options?`): `Promise`<[`SummarizationReturn`](../modules.md#summarizationreturn)\>

This task is well known to summarize longer text into shorter text. Be careful, some models have a maximum length of input. That means that the summary cannot handle full books for instance. Be careful when choosing your model.

#### Parameters

| Name | Type |
| :------ | :------ |
| `args` | [`SummarizationArgs`](../modules.md#summarizationargs) |
| `options?` | [`Options`](../modules.md#options) |

#### Returns

`Promise`<[`SummarizationReturn`](../modules.md#summarizationreturn)\>

#### Defined in

[HfInference.ts:522](https://github.com/huggingface/huggingface.js/blob/main/packages/inference/src/HfInference.ts#L522)

___

### tableQuestionAnswer

▸ **tableQuestionAnswer**(`args`, `options?`): `Promise`<[`TableQuestionAnswerReturn`](../modules.md#tablequestionanswerreturn)\>

Don’t know SQL? Don’t want to dive into a large spreadsheet? Ask questions in plain english! Recommended model: google/tapas-base-finetuned-wtq.

#### Parameters

| Name | Type |
| :------ | :------ |
| `args` | [`TableQuestionAnswerArgs`](../modules.md#tablequestionanswerargs) |
| `options?` | [`Options`](../modules.md#options) |

#### Returns

`Promise`<[`TableQuestionAnswerReturn`](../modules.md#tablequestionanswerreturn)\>

#### Defined in

[HfInference.ts:536](https://github.com/huggingface/huggingface.js/blob/main/packages/inference/src/HfInference.ts#L536)

___

### textClassification

▸ **textClassification**(`args`, `options?`): `Promise`<[`TextClassificationReturn`](../modules.md#textclassificationreturn)\>

Usually used for sentiment-analysis this will output the likelihood of classes of an input. Recommended model: distilbert-base-uncased-finetuned-sst-2-english

#### Parameters

| Name | Type |
| :------ | :------ |
| `args` | [`TextClassificationArgs`](../modules.md#textclassificationargs) |
| `options?` | [`Options`](../modules.md#options) |

#### Returns

`Promise`<[`TextClassificationReturn`](../modules.md#textclassificationreturn)\>

#### Defined in

[HfInference.ts:546](https://github.com/huggingface/huggingface.js/blob/main/packages/inference/src/HfInference.ts#L546)

___

### textGeneration

▸ **textGeneration**(`args`, `options?`): `Promise`<[`TextGenerationReturn`](../modules.md#textgenerationreturn)\>

Use to continue text from a prompt. This is a very generic task. Recommended model: gpt2 (it’s a simple model, but fun to play with).

#### Parameters

| Name | Type |
| :------ | :------ |
| `args` | [`TextGenerationArgs`](../modules.md#textgenerationargs) |
| `options?` | [`Options`](../modules.md#options) |

#### Returns

`Promise`<[`TextGenerationReturn`](../modules.md#textgenerationreturn)\>

#### Defined in

[HfInference.ts:553](https://github.com/huggingface/huggingface.js/blob/main/packages/inference/src/HfInference.ts#L553)

___

### textToImage

▸ **textToImage**(`args`, `options?`): `Promise`<`ArrayBuffer`\>

This task reads some text input and outputs an image.
Recommended model: stabilityai/stable-diffusion-2

#### Parameters

| Name | Type |
| :------ | :------ |
| `args` | [`TextToImageArgs`](../modules.md#texttoimageargs) |
| `options?` | [`Options`](../modules.md#options) |

#### Returns

`Promise`<`ArrayBuffer`\>

#### Defined in

[HfInference.ts:667](https://github.com/huggingface/huggingface.js/blob/main/packages/inference/src/HfInference.ts#L667)

___

### tokenClassification

▸ **tokenClassification**(`args`, `options?`): `Promise`<[`TokenClassificationReturn`](../modules.md#tokenclassificationreturn)\>

Usually used for sentence parsing, either grammatical, or Named Entity Recognition (NER) to understand keywords contained within text. Recommended model: dbmdz/bert-large-cased-finetuned-conll03-english

#### Parameters

| Name | Type |
| :------ | :------ |
| `args` | [`TokenClassificationArgs`](../modules.md#tokenclassificationargs) |
| `options?` | [`Options`](../modules.md#options) |

#### Returns

`Promise`<[`TokenClassificationReturn`](../modules.md#tokenclassificationreturn)\>

#### Defined in

[HfInference.ts:560](https://github.com/huggingface/huggingface.js/blob/main/packages/inference/src/HfInference.ts#L560)

___

### translation

▸ **translation**(`args`, `options?`): `Promise`<[`TranslationReturn`](../modules.md#translationreturn)\>

This task is well known to translate text from one language to another. Recommended model: Helsinki-NLP/opus-mt-ru-en.

#### Parameters

| Name | Type |
| :------ | :------ |
| `args` | [`TranslationArgs`](../modules.md#translationargs) |
| `options?` | [`Options`](../modules.md#options) |

#### Returns

`Promise`<[`TranslationReturn`](../modules.md#translationreturn)\>

#### Defined in

[HfInference.ts:570](https://github.com/huggingface/huggingface.js/blob/main/packages/inference/src/HfInference.ts#L570)

___

### zeroShotClassification

▸ **zeroShotClassification**(`args`, `options?`): `Promise`<[`ZeroShotClassificationReturn`](../modules.md#zeroshotclassificationreturn)\>

This task is super useful to try out classification with zero code, you simply pass a sentence/paragraph and the possible labels for that sentence, and you get a result. Recommended model: facebook/bart-large-mnli.

#### Parameters

| Name | Type |
| :------ | :------ |
| `args` | [`ZeroShotClassificationArgs`](../modules.md#zeroshotclassificationargs) |
| `options?` | [`Options`](../modules.md#options) |

#### Returns

`Promise`<[`ZeroShotClassificationReturn`](../modules.md#zeroshotclassificationreturn)\>

#### Defined in

[HfInference.ts:577](https://github.com/huggingface/huggingface.js/blob/main/packages/inference/src/HfInference.ts#L577)

___

### toArray

▸ `Static` `Private` **toArray**(`obj`): `any`[]

#### Parameters

| Name | Type |
| :------ | :------ |
| `obj` | `any` |

#### Returns

`any`[]

#### Defined in

[HfInference.ts:732](https://github.com/huggingface/huggingface.js/blob/main/packages/inference/src/HfInference.ts#L732)
