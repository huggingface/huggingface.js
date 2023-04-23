# Class: HfInferenceEndpoint

## Hierarchy

- `TaskWithNoAccessTokenNoModel`

  ↳ **`HfInferenceEndpoint`**

## Constructors

### constructor

• **new HfInferenceEndpoint**(`endpointUrl`, `accessToken?`, `defaultOptions?`)

#### Parameters

| Name | Type | Default value |
| :------ | :------ | :------ |
| `endpointUrl` | `string` | `undefined` |
| `accessToken` | `string` | `""` |
| `defaultOptions` | [`Options`](../interfaces/Options) | `{}` |

#### Defined in

[HfInference.ts:48](https://github.com/huggingface/huggingface.js/blob/main/packages/inference/src/HfInference.ts#L48)

## Properties

### audioClassification

• **audioClassification**: (`args`: { `data`: `Blob` \| `ArrayBuffer`  }, `options?`: [`Options`](../interfaces/Options)) => `Promise`<[`AudioClassificationReturn`](../modules#audioclassificationreturn)\>

#### Type declaration

▸ (`args`, `options?`): `Promise`<[`AudioClassificationReturn`](../modules#audioclassificationreturn)\>

##### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `args` | `Object` | - |
| `args.data` | `Blob` \| `ArrayBuffer` | Binary audio data |
| `options?` | [`Options`](../interfaces/Options) | - |

##### Returns

`Promise`<[`AudioClassificationReturn`](../modules#audioclassificationreturn)\>

#### Defined in

[tasks/audio/audioClassification.ts:30](https://github.com/huggingface/huggingface.js/blob/main/packages/inference/src/tasks/audio/audioClassification.ts#L30)

___

### automaticSpeechRecognition

• **automaticSpeechRecognition**: (`args`: { `data`: `Blob` \| `ArrayBuffer`  }, `options?`: [`Options`](../interfaces/Options)) => `Promise`<[`AutomaticSpeechRecognitionOutput`](../interfaces/AutomaticSpeechRecognitionOutput)\>

#### Type declaration

▸ (`args`, `options?`): `Promise`<[`AutomaticSpeechRecognitionOutput`](../interfaces/AutomaticSpeechRecognitionOutput)\>

##### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `args` | `Object` | - |
| `args.data` | `Blob` \| `ArrayBuffer` | Binary audio data |
| `options?` | [`Options`](../interfaces/Options) | - |

##### Returns

`Promise`<[`AutomaticSpeechRecognitionOutput`](../interfaces/AutomaticSpeechRecognitionOutput)\>

#### Defined in

[tasks/audio/automaticSpeechRecognition.ts:23](https://github.com/huggingface/huggingface.js/blob/main/packages/inference/src/tasks/audio/automaticSpeechRecognition.ts#L23)

___

### conversational

• **conversational**: (`args`: { `inputs`: { `generated_responses?`: `string`[] ; `past_user_inputs?`: `string`[] ; `text`: `string`  } ; `parameters?`: { `max_length?`: `number` ; `max_time?`: `number` ; `min_length?`: `number` ; `repetition_penalty?`: `number` ; `temperature?`: `number` ; `top_k?`: `number` ; `top_p?`: `number`  }  }, `options?`: [`Options`](../interfaces/Options)) => `Promise`<[`ConversationalOutput`](../interfaces/ConversationalOutput)\>

#### Type declaration

▸ (`args`, `options?`): `Promise`<[`ConversationalOutput`](../interfaces/ConversationalOutput)\>

##### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `args` | `Object` | - |
| `args.inputs` | `Object` | - |
| `args.inputs.generated_responses?` | `string`[] | A list of strings corresponding to the earlier replies from the model. |
| `args.inputs.past_user_inputs?` | `string`[] | A list of strings corresponding to the earlier replies from the user. Should be of the same length of generated_responses. |
| `args.inputs.text` | `string` | The last input from the user in the conversation. |
| `args.parameters?` | `Object` | - |
| `args.parameters.max_length?` | `number` | (Default: None). Integer to define the maximum length in tokens of the output summary. |
| `args.parameters.max_time?` | `number` | (Default: None). Float (0-120.0). The amount of time in seconds that the query should take maximum. Network can cause some overhead so it will be a soft limit. |
| `args.parameters.min_length?` | `number` | (Default: None). Integer to define the minimum length in tokens of the output summary. |
| `args.parameters.repetition_penalty?` | `number` | (Default: None). Float (0.0-100.0). The more a token is used within generation the more it is penalized to not be picked in successive generation passes. |
| `args.parameters.temperature?` | `number` | (Default: 1.0). Float (0.0-100.0). The temperature of the sampling operation. 1 means regular sampling, 0 means always take the highest score, 100.0 is getting closer to uniform probability. |
| `args.parameters.top_k?` | `number` | (Default: None). Integer to define the top tokens considered within the sample operation to create new text. |
| `args.parameters.top_p?` | `number` | (Default: None). Float to define the tokens that are within the sample operation of text generation. Add tokens in the sample for more probable to least probable until the sum of the probabilities is greater than top_p. |
| `options?` | [`Options`](../interfaces/Options) | - |

##### Returns

`Promise`<[`ConversationalOutput`](../interfaces/ConversationalOutput)\>

#### Defined in

[tasks/nlp/conversational.ts:65](https://github.com/huggingface/huggingface.js/blob/main/packages/inference/src/tasks/nlp/conversational.ts#L65)

___

### documentQuestionAnswering

• **documentQuestionAnswering**: (`args`: { `inputs`: { `image`: `Blob` ; `question`: `string`  }  }, `options?`: [`Options`](../interfaces/Options)) => `Promise`<[`DocumentQuestionAnsweringOutput`](../interfaces/DocumentQuestionAnsweringOutput)\>

#### Type declaration

▸ (`args`, `options?`): `Promise`<[`DocumentQuestionAnsweringOutput`](../interfaces/DocumentQuestionAnsweringOutput)\>

##### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `args` | `Object` | - |
| `args.inputs` | `Object` | - |
| `args.inputs.image` | `Blob` | Raw image You can use native `File` in browsers, or `new Blob([buffer])` in node, or for a base64 image `new Blob([btoa(base64String)])`, or even `await (await fetch('...)).blob()` |
| `args.inputs.question` | `string` | - |
| `options?` | [`Options`](../interfaces/Options) | - |

##### Returns

`Promise`<[`DocumentQuestionAnsweringOutput`](../interfaces/DocumentQuestionAnsweringOutput)\>

#### Defined in

[tasks/multimodal/documentQuestionAnswering.ts:41](https://github.com/huggingface/huggingface.js/blob/main/packages/inference/src/tasks/multimodal/documentQuestionAnswering.ts#L41)

___

### featureExtraction

• **featureExtraction**: (`args`: { `inputs`: `string` \| `string`[]  }, `options?`: [`Options`](../interfaces/Options)) => `Promise`<[`FeatureExtractionOutput`](../modules#featureextractionoutput)\>

#### Type declaration

▸ (`args`, `options?`): `Promise`<[`FeatureExtractionOutput`](../modules#featureextractionoutput)\>

##### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `args` | `Object` | - |
| `args.inputs` | `string` \| `string`[] | The inputs is a string or a list of strings to get the features from. inputs: "That is a happy person", |
| `options?` | [`Options`](../interfaces/Options) | - |

##### Returns

`Promise`<[`FeatureExtractionOutput`](../modules#featureextractionoutput)\>

#### Defined in

[tasks/nlp/featureExtraction.ts:23](https://github.com/huggingface/huggingface.js/blob/main/packages/inference/src/tasks/nlp/featureExtraction.ts#L23)

___

### fillMask

• **fillMask**: (`args`: { `inputs`: `string`  }, `options?`: [`Options`](../interfaces/Options)) => `Promise`<[`FillMaskOutput`](../modules#fillmaskoutput)\>

#### Type declaration

▸ (`args`, `options?`): `Promise`<[`FillMaskOutput`](../modules#fillmaskoutput)\>

##### Parameters

| Name | Type |
| :------ | :------ |
| `args` | `Object` |
| `args.inputs` | `string` |
| `options?` | [`Options`](../interfaces/Options) |

##### Returns

`Promise`<[`FillMaskOutput`](../modules#fillmaskoutput)\>

#### Defined in

[tasks/nlp/fillMask.ts:31](https://github.com/huggingface/huggingface.js/blob/main/packages/inference/src/tasks/nlp/fillMask.ts#L31)

___

### imageClassification

• **imageClassification**: (`args`: { `data`: `Blob` \| `ArrayBuffer`  }, `options?`: [`Options`](../interfaces/Options)) => `Promise`<[`ImageClassificationOutput`](../modules#imageclassificationoutput)\>

#### Type declaration

▸ (`args`, `options?`): `Promise`<[`ImageClassificationOutput`](../modules#imageclassificationoutput)\>

##### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `args` | `Object` | - |
| `args.data` | `Blob` \| `ArrayBuffer` | Binary image data |
| `options?` | [`Options`](../interfaces/Options) | - |

##### Returns

`Promise`<[`ImageClassificationOutput`](../modules#imageclassificationoutput)\>

#### Defined in

[tasks/cv/imageClassification.ts:29](https://github.com/huggingface/huggingface.js/blob/main/packages/inference/src/tasks/cv/imageClassification.ts#L29)

___

### imageSegmentation

• **imageSegmentation**: (`args`: { `data`: `Blob` \| `ArrayBuffer`  }, `options?`: [`Options`](../interfaces/Options)) => `Promise`<[`ImageSegmentationOutput`](../modules#imagesegmentationoutput)\>

#### Type declaration

▸ (`args`, `options?`): `Promise`<[`ImageSegmentationOutput`](../modules#imagesegmentationoutput)\>

##### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `args` | `Object` | - |
| `args.data` | `Blob` \| `ArrayBuffer` | Binary image data |
| `options?` | [`Options`](../interfaces/Options) | - |

##### Returns

`Promise`<[`ImageSegmentationOutput`](../modules#imagesegmentationoutput)\>

#### Defined in

[tasks/cv/imageSegmentation.ts:33](https://github.com/huggingface/huggingface.js/blob/main/packages/inference/src/tasks/cv/imageSegmentation.ts#L33)

___

### imageToText

• **imageToText**: (`args`: { `data`: `Blob` \| `ArrayBuffer`  }, `options?`: [`Options`](../interfaces/Options)) => `Promise`<[`ImageToTextOutput`](../interfaces/ImageToTextOutput)\>

#### Type declaration

▸ (`args`, `options?`): `Promise`<[`ImageToTextOutput`](../interfaces/ImageToTextOutput)\>

##### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `args` | `Object` | - |
| `args.data` | `Blob` \| `ArrayBuffer` | Binary image data |
| `options?` | [`Options`](../interfaces/Options) | - |

##### Returns

`Promise`<[`ImageToTextOutput`](../interfaces/ImageToTextOutput)\>

#### Defined in

[tasks/cv/imageToText.ts:22](https://github.com/huggingface/huggingface.js/blob/main/packages/inference/src/tasks/cv/imageToText.ts#L22)

___

### objectDetection

• **objectDetection**: (`args`: { `data`: `Blob` \| `ArrayBuffer`  }, `options?`: [`Options`](../interfaces/Options)) => `Promise`<[`ObjectDetectionOutput`](../modules#objectdetectionoutput)\>

#### Type declaration

▸ (`args`, `options?`): `Promise`<[`ObjectDetectionOutput`](../modules#objectdetectionoutput)\>

##### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `args` | `Object` | - |
| `args.data` | `Blob` \| `ArrayBuffer` | Binary image data |
| `options?` | [`Options`](../interfaces/Options) | - |

##### Returns

`Promise`<[`ObjectDetectionOutput`](../modules#objectdetectionoutput)\>

#### Defined in

[tasks/cv/objectDetection.ts:39](https://github.com/huggingface/huggingface.js/blob/main/packages/inference/src/tasks/cv/objectDetection.ts#L39)

___

### questionAnswering

• **questionAnswering**: (`args`: { `inputs`: { `context`: `string` ; `question`: `string`  }  }, `options?`: [`Options`](../interfaces/Options)) => `Promise`<[`QuestionAnsweringOutput`](../interfaces/QuestionAnsweringOutput)\>

#### Type declaration

▸ (`args`, `options?`): `Promise`<[`QuestionAnsweringOutput`](../interfaces/QuestionAnsweringOutput)\>

##### Parameters

| Name | Type |
| :------ | :------ |
| `args` | `Object` |
| `args.inputs` | `Object` |
| `args.inputs.context` | `string` |
| `args.inputs.question` | `string` |
| `options?` | [`Options`](../interfaces/Options) |

##### Returns

`Promise`<[`QuestionAnsweringOutput`](../interfaces/QuestionAnsweringOutput)\>

#### Defined in

[tasks/nlp/questionAnswering.ts:34](https://github.com/huggingface/huggingface.js/blob/main/packages/inference/src/tasks/nlp/questionAnswering.ts#L34)

___

### request

• **request**: (`args`: { `data`: `Blob` \| `ArrayBuffer` ; `parameters?`: `Record`<`string`, `unknown`\>  } \| { `inputs`: `unknown` ; `parameters?`: `Record`<`string`, `unknown`\>  }, `options?`: [`Options`](../interfaces/Options) & { `includeCredentials?`: `boolean`  }) => `Promise`<`unknown`\>

#### Type declaration

▸ (`args`, `options?`): `Promise`<`unknown`\>

##### Parameters

| Name | Type |
| :------ | :------ |
| `args` | { `data`: `Blob` \| `ArrayBuffer` ; `parameters?`: `Record`<`string`, `unknown`\>  } \| { `inputs`: `unknown` ; `parameters?`: `Record`<`string`, `unknown`\>  } |
| `options?` | [`Options`](../interfaces/Options) & { `includeCredentials?`: `boolean`  } |

##### Returns

`Promise`<`unknown`\>

#### Defined in

[tasks/custom/request.ts:7](https://github.com/huggingface/huggingface.js/blob/main/packages/inference/src/tasks/custom/request.ts#L7)

___

### sentenceSimilarity

• **sentenceSimilarity**: (`args`: { `inputs`: `Record`<`string`, `unknown`\> \| `Record`<`string`, `unknown`\>[]  }, `options?`: [`Options`](../interfaces/Options)) => `Promise`<[`SentenceSimilarityOutput`](../modules#sentencesimilarityoutput)\>

#### Type declaration

▸ (`args`, `options?`): `Promise`<[`SentenceSimilarityOutput`](../modules#sentencesimilarityoutput)\>

##### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `args` | `Object` | - |
| `args.inputs` | `Record`<`string`, `unknown`\> \| `Record`<`string`, `unknown`\>[] | The inputs vary based on the model. For example when using sentence-transformers/paraphrase-xlm-r-multilingual-v1 the inputs will have a `source_sentence` string and a `sentences` array of strings |
| `options?` | [`Options`](../interfaces/Options) | - |

##### Returns

`Promise`<[`SentenceSimilarityOutput`](../modules#sentencesimilarityoutput)\>

#### Defined in

[tasks/nlp/sentenceSimilarity.ts:23](https://github.com/huggingface/huggingface.js/blob/main/packages/inference/src/tasks/nlp/sentenceSimilarity.ts#L23)

___

### streamingRequest

• **streamingRequest**: (`args`: { `data`: `Blob` \| `ArrayBuffer` ; `parameters?`: `Record`<`string`, `unknown`\>  } \| { `inputs`: `unknown` ; `parameters?`: `Record`<`string`, `unknown`\>  }, `options?`: [`Options`](../interfaces/Options) & { `includeCredentials?`: `boolean`  }) => `AsyncGenerator`<`unknown`, `any`, `unknown`\>

#### Type declaration

▸ (`args`, `options?`): `AsyncGenerator`<`unknown`, `any`, `unknown`\>

##### Parameters

| Name | Type |
| :------ | :------ |
| `args` | { `data`: `Blob` \| `ArrayBuffer` ; `parameters?`: `Record`<`string`, `unknown`\>  } \| { `inputs`: `unknown` ; `parameters?`: `Record`<`string`, `unknown`\>  } |
| `options?` | [`Options`](../interfaces/Options) & { `includeCredentials?`: `boolean`  } |

##### Returns

`AsyncGenerator`<`unknown`, `any`, `unknown`\>

#### Defined in

[tasks/custom/streamingRequest.ts:9](https://github.com/huggingface/huggingface.js/blob/main/packages/inference/src/tasks/custom/streamingRequest.ts#L9)

___

### summarization

• **summarization**: (`args`: { `inputs`: `string` ; `parameters?`: { `max_length?`: `number` ; `max_time?`: `number` ; `min_length?`: `number` ; `repetition_penalty?`: `number` ; `temperature?`: `number` ; `top_k?`: `number` ; `top_p?`: `number`  }  }, `options?`: [`Options`](../interfaces/Options)) => `Promise`<[`SummarizationOutput`](../interfaces/SummarizationOutput)\>

#### Type declaration

▸ (`args`, `options?`): `Promise`<[`SummarizationOutput`](../interfaces/SummarizationOutput)\>

##### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `args` | `Object` | - |
| `args.inputs` | `string` | A string to be summarized |
| `args.parameters?` | `Object` | - |
| `args.parameters.max_length?` | `number` | (Default: None). Integer to define the maximum length in tokens of the output summary. |
| `args.parameters.max_time?` | `number` | (Default: None). Float (0-120.0). The amount of time in seconds that the query should take maximum. Network can cause some overhead so it will be a soft limit. |
| `args.parameters.min_length?` | `number` | (Default: None). Integer to define the minimum length in tokens of the output summary. |
| `args.parameters.repetition_penalty?` | `number` | (Default: None). Float (0.0-100.0). The more a token is used within generation the more it is penalized to not be picked in successive generation passes. |
| `args.parameters.temperature?` | `number` | (Default: 1.0). Float (0.0-100.0). The temperature of the sampling operation. 1 means regular sampling, 0 means always take the highest score, 100.0 is getting closer to uniform probability. |
| `args.parameters.top_k?` | `number` | (Default: None). Integer to define the top tokens considered within the sample operation to create new text. |
| `args.parameters.top_p?` | `number` | (Default: None). Float to define the tokens that are within the sample operation of text generation. Add tokens in the sample for more probable to least probable until the sum of the probabilities is greater than top_p. |
| `options?` | [`Options`](../interfaces/Options) | - |

##### Returns

`Promise`<[`SummarizationOutput`](../interfaces/SummarizationOutput)\>

#### Defined in

[tasks/nlp/summarization.ts:52](https://github.com/huggingface/huggingface.js/blob/main/packages/inference/src/tasks/nlp/summarization.ts#L52)

___

### tableQuestionAnswering

• **tableQuestionAnswering**: (`args`: { `inputs`: { `query`: `string` ; `table`: `Record`<`string`, `string`[]\>  }  }, `options?`: [`Options`](../interfaces/Options)) => `Promise`<[`TableQuestionAnsweringOutput`](../interfaces/TableQuestionAnsweringOutput)\>

#### Type declaration

▸ (`args`, `options?`): `Promise`<[`TableQuestionAnsweringOutput`](../interfaces/TableQuestionAnsweringOutput)\>

##### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `args` | `Object` | - |
| `args.inputs` | `Object` | - |
| `args.inputs.query` | `string` | The query in plain text that you want to ask the table |
| `args.inputs.table` | `Record`<`string`, `string`[]\> | A table of data represented as a dict of list where entries are headers and the lists are all the values, all lists must have the same size. |
| `options?` | [`Options`](../interfaces/Options) | - |

##### Returns

`Promise`<[`TableQuestionAnsweringOutput`](../interfaces/TableQuestionAnsweringOutput)\>

#### Defined in

[tasks/nlp/tableQuestionAnswering.ts:40](https://github.com/huggingface/huggingface.js/blob/main/packages/inference/src/tasks/nlp/tableQuestionAnswering.ts#L40)

___

### textClassification

• **textClassification**: (`args`: { `inputs`: `string`  }, `options?`: [`Options`](../interfaces/Options)) => `Promise`<[`TextClassificationOutput`](../modules#textclassificationoutput)\>

#### Type declaration

▸ (`args`, `options?`): `Promise`<[`TextClassificationOutput`](../modules#textclassificationoutput)\>

##### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `args` | `Object` | - |
| `args.inputs` | `string` | A string to be classified |
| `options?` | [`Options`](../interfaces/Options) | - |

##### Returns

`Promise`<[`TextClassificationOutput`](../modules#textclassificationoutput)\>

#### Defined in

[tasks/nlp/textClassification.ts:26](https://github.com/huggingface/huggingface.js/blob/main/packages/inference/src/tasks/nlp/textClassification.ts#L26)

___

### textGeneration

• **textGeneration**: (`args`: { `inputs`: `string` ; `parameters?`: { `do_sample?`: `boolean` ; `max_new_tokens?`: `number` ; `max_time?`: `number` ; `num_return_sequences?`: `number` ; `repetition_penalty?`: `number` ; `return_full_text?`: `boolean` ; `temperature?`: `number` ; `top_k?`: `number` ; `top_p?`: `number`  }  }, `options?`: [`Options`](../interfaces/Options)) => `Promise`<[`TextGenerationOutput`](../interfaces/TextGenerationOutput)\>

#### Type declaration

▸ (`args`, `options?`): `Promise`<[`TextGenerationOutput`](../interfaces/TextGenerationOutput)\>

##### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `args` | `Object` | - |
| `args.inputs` | `string` | A string to be generated from |
| `args.parameters?` | `Object` | - |
| `args.parameters.do_sample?` | `boolean` | (Optional: True). Bool. Whether or not to use sampling, use greedy decoding otherwise. |
| `args.parameters.max_new_tokens?` | `number` | (Default: None). Int (0-250). The amount of new tokens to be generated, this does not include the input length it is a estimate of the size of generated text you want. Each new tokens slows down the request, so look for balance between response times and length of text generated. |
| `args.parameters.max_time?` | `number` | (Default: None). Float (0-120.0). The amount of time in seconds that the query should take maximum. Network can cause some overhead so it will be a soft limit. Use that in combination with max_new_tokens for best results. |
| `args.parameters.num_return_sequences?` | `number` | (Default: 1). Integer. The number of proposition you want to be returned. |
| `args.parameters.repetition_penalty?` | `number` | (Default: None). Float (0.0-100.0). The more a token is used within generation the more it is penalized to not be picked in successive generation passes. |
| `args.parameters.return_full_text?` | `boolean` | (Default: True). Bool. If set to False, the return results will not contain the original query making it easier for prompting. |
| `args.parameters.temperature?` | `number` | (Default: 1.0). Float (0.0-100.0). The temperature of the sampling operation. 1 means regular sampling, 0 means always take the highest score, 100.0 is getting closer to uniform probability. |
| `args.parameters.top_k?` | `number` | (Default: None). Integer to define the top tokens considered within the sample operation to create new text. |
| `args.parameters.top_p?` | `number` | (Default: None). Float to define the tokens that are within the sample operation of text generation. Add tokens in the sample for more probable to least probable until the sum of the probabilities is greater than top_p. |
| `options?` | [`Options`](../interfaces/Options) | - |

##### Returns

`Promise`<[`TextGenerationOutput`](../interfaces/TextGenerationOutput)\>

#### Defined in

[tasks/nlp/textGeneration.ts:60](https://github.com/huggingface/huggingface.js/blob/main/packages/inference/src/tasks/nlp/textGeneration.ts#L60)

___

### textGenerationStream

• **textGenerationStream**: (`args`: { `inputs`: `string` ; `parameters?`: { `do_sample?`: `boolean` ; `max_new_tokens?`: `number` ; `max_time?`: `number` ; `num_return_sequences?`: `number` ; `repetition_penalty?`: `number` ; `return_full_text?`: `boolean` ; `temperature?`: `number` ; `top_k?`: `number` ; `top_p?`: `number`  }  }, `options?`: [`Options`](../interfaces/Options)) => `AsyncGenerator`<[`TextGenerationStreamOutput`](../interfaces/TextGenerationStreamOutput), `any`, `unknown`\>

#### Type declaration

▸ (`args`, `options?`): `AsyncGenerator`<[`TextGenerationStreamOutput`](../interfaces/TextGenerationStreamOutput), `any`, `unknown`\>

##### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `args` | `Object` | - |
| `args.inputs` | `string` | A string to be generated from |
| `args.parameters?` | `Object` | - |
| `args.parameters.do_sample?` | `boolean` | (Optional: True). Bool. Whether or not to use sampling, use greedy decoding otherwise. |
| `args.parameters.max_new_tokens?` | `number` | (Default: None). Int (0-250). The amount of new tokens to be generated, this does not include the input length it is a estimate of the size of generated text you want. Each new tokens slows down the request, so look for balance between response times and length of text generated. |
| `args.parameters.max_time?` | `number` | (Default: None). Float (0-120.0). The amount of time in seconds that the query should take maximum. Network can cause some overhead so it will be a soft limit. Use that in combination with max_new_tokens for best results. |
| `args.parameters.num_return_sequences?` | `number` | (Default: 1). Integer. The number of proposition you want to be returned. |
| `args.parameters.repetition_penalty?` | `number` | (Default: None). Float (0.0-100.0). The more a token is used within generation the more it is penalized to not be picked in successive generation passes. |
| `args.parameters.return_full_text?` | `boolean` | (Default: True). Bool. If set to False, the return results will not contain the original query making it easier for prompting. |
| `args.parameters.temperature?` | `number` | (Default: 1.0). Float (0.0-100.0). The temperature of the sampling operation. 1 means regular sampling, 0 means always take the highest score, 100.0 is getting closer to uniform probability. |
| `args.parameters.top_k?` | `number` | (Default: None). Integer to define the top tokens considered within the sample operation to create new text. |
| `args.parameters.top_p?` | `number` | (Default: None). Float to define the tokens that are within the sample operation of text generation. Add tokens in the sample for more probable to least probable until the sum of the probabilities is greater than top_p. |
| `options?` | [`Options`](../interfaces/Options) | - |

##### Returns

`AsyncGenerator`<[`TextGenerationStreamOutput`](../interfaces/TextGenerationStreamOutput), `any`, `unknown`\>

#### Defined in

[tasks/nlp/textGenerationStream.ts:87](https://github.com/huggingface/huggingface.js/blob/main/packages/inference/src/tasks/nlp/textGenerationStream.ts#L87)

___

### textToImage

• **textToImage**: (`args`: { `inputs`: `string` ; `parameters?`: { `guidance_scale?`: `number` ; `height?`: `number` ; `negative_prompt?`: `string` ; `num_inference_steps?`: `number` ; `width?`: `number`  }  }, `options?`: [`Options`](../interfaces/Options)) => `Promise`<`Blob`\>

#### Type declaration

▸ (`args`, `options?`): `Promise`<`Blob`\>

##### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `args` | `Object` | - |
| `args.inputs` | `string` | The text to generate an image from |
| `args.parameters?` | `Object` | - |
| `args.parameters.guidance_scale?` | `number` | Guidance scale: Higher guidance scale encourages to generate images that are closely linked to the text `prompt`, usually at the expense of lower image quality. |
| `args.parameters.height?` | `number` | The height in pixels of the generated image |
| `args.parameters.negative_prompt?` | `string` | An optional negative prompt for the image generation |
| `args.parameters.num_inference_steps?` | `number` | The number of denoising steps. More denoising steps usually lead to a higher quality image at the expense of slower inference. |
| `args.parameters.width?` | `number` | The width in pixels of the generated image |
| `options?` | [`Options`](../interfaces/Options) | - |

##### Returns

`Promise`<`Blob`\>

#### Defined in

[tasks/cv/textToImage.ts:41](https://github.com/huggingface/huggingface.js/blob/main/packages/inference/src/tasks/cv/textToImage.ts#L41)

___

### tokenClassification

• **tokenClassification**: (`args`: { `inputs`: `string` ; `parameters?`: { `aggregation_strategy?`: ``"none"`` \| ``"simple"`` \| ``"first"`` \| ``"average"`` \| ``"max"``  }  }, `options?`: [`Options`](../interfaces/Options)) => `Promise`<[`TokenClassificationOutput`](../modules#tokenclassificationoutput)\>

#### Type declaration

▸ (`args`, `options?`): `Promise`<[`TokenClassificationOutput`](../modules#tokenclassificationoutput)\>

##### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `args` | `Object` | - |
| `args.inputs` | `string` | A string to be classified |
| `args.parameters?` | `Object` | - |
| `args.parameters.aggregation_strategy?` | ``"none"`` \| ``"simple"`` \| ``"first"`` \| ``"average"`` \| ``"max"`` | (Default: simple). There are several aggregation strategies: none: Every token gets classified without further aggregation. simple: Entities are grouped according to the default schema (B-, I- tags get merged when the tag is similar). first: Same as the simple strategy except words cannot end up with different tags. Words will use the tag of the first token when there is ambiguity. average: Same as the simple strategy except words cannot end up with different tags. Scores are averaged across tokens and then the maximum label is applied. max: Same as the simple strategy except words cannot end up with different tags. Word entity will be the token with the maximum score. |
| `options?` | [`Options`](../interfaces/Options) | - |

##### Returns

`Promise`<[`TokenClassificationOutput`](../modules#tokenclassificationoutput)\>

#### Defined in

[tasks/nlp/tokenClassification.ts:57](https://github.com/huggingface/huggingface.js/blob/main/packages/inference/src/tasks/nlp/tokenClassification.ts#L57)

___

### translation

• **translation**: (`args`: { `inputs`: `string`  }, `options?`: [`Options`](../interfaces/Options)) => `Promise`<[`TranslationOutput`](../interfaces/TranslationOutput)\>

#### Type declaration

▸ (`args`, `options?`): `Promise`<[`TranslationOutput`](../interfaces/TranslationOutput)\>

##### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `args` | `Object` | - |
| `args.inputs` | `string` | A string to be translated |
| `options?` | [`Options`](../interfaces/Options) | - |

##### Returns

`Promise`<[`TranslationOutput`](../interfaces/TranslationOutput)\>

#### Defined in

[tasks/nlp/translation.ts:22](https://github.com/huggingface/huggingface.js/blob/main/packages/inference/src/tasks/nlp/translation.ts#L22)

___

### visualQuestionAnswering

• **visualQuestionAnswering**: (`args`: { `inputs`: { `image`: `Blob` ; `question`: `string`  }  }, `options?`: [`Options`](../interfaces/Options)) => `Promise`<[`VisualQuestionAnsweringOutput`](../interfaces/VisualQuestionAnsweringOutput)\>

#### Type declaration

▸ (`args`, `options?`): `Promise`<[`VisualQuestionAnsweringOutput`](../interfaces/VisualQuestionAnsweringOutput)\>

##### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `args` | `Object` | - |
| `args.inputs` | `Object` | - |
| `args.inputs.image` | `Blob` | Raw image You can use native `File` in browsers, or `new Blob([buffer])` in node, or for a base64 image `new Blob([btoa(base64String)])`, or even `await (await fetch('...)).blob()` |
| `args.inputs.question` | `string` | - |
| `options?` | [`Options`](../interfaces/Options) | - |

##### Returns

`Promise`<[`VisualQuestionAnsweringOutput`](../interfaces/VisualQuestionAnsweringOutput)\>

#### Defined in

[tasks/multimodal/visualQuestionAnswering.ts:32](https://github.com/huggingface/huggingface.js/blob/main/packages/inference/src/tasks/multimodal/visualQuestionAnswering.ts#L32)

___

### zeroShotClassification

• **zeroShotClassification**: (`args`: { `inputs`: `string` \| `string`[] ; `parameters`: { `candidate_labels`: `string`[] ; `multi_label?`: `boolean`  }  }, `options?`: [`Options`](../interfaces/Options)) => `Promise`<[`ZeroShotClassificationOutput`](../modules#zeroshotclassificationoutput)\>

#### Type declaration

▸ (`args`, `options?`): `Promise`<[`ZeroShotClassificationOutput`](../modules#zeroshotclassificationoutput)\>

##### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `args` | `Object` | - |
| `args.inputs` | `string` \| `string`[] | a string or list of strings |
| `args.parameters` | `Object` | - |
| `args.parameters.candidate_labels` | `string`[] | a list of strings that are potential classes for inputs. (max 10 candidate_labels, for more, simply run multiple requests, results are going to be misleading if using too many candidate_labels anyway. If you want to keep the exact same, you can simply run multi_label=True and do the scaling on your end. |
| `args.parameters.multi_label?` | `boolean` | (Default: false) Boolean that is set to True if classes can overlap |
| `options?` | [`Options`](../interfaces/Options) | - |

##### Returns

`Promise`<[`ZeroShotClassificationOutput`](../modules#zeroshotclassificationoutput)\>

#### Defined in

[tasks/nlp/zeroShotClassification.ts:34](https://github.com/huggingface/huggingface.js/blob/main/packages/inference/src/tasks/nlp/zeroShotClassification.ts#L34)
