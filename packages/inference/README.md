# 🤗 Hugging Face Inference API

A Typescript powered wrapper for the Hugging Face Inference API. Learn more about the Inference API at [Hugging Face](https://huggingface.co/docs/api-inference/index).

## Install

```console
npm install @huggingface/inference

yarn add @huggingface/inference

pnpm add @huggingface/inference
```

## Usage

❗**Important note:** Using an API key is optional to get started (simply provide a random string), however you will be rate limited eventually. Join [Hugging Face](https://huggingface.co/join) and then visit [access tokens](https://huggingface.co/settings/tokens) to generate your API key.

### Basic examples

```typescript
import { HfInference } from '@huggingface/inference'

const hf = new HfInference('your api key')

// Natural Language

await hf.fillMask({
  model: 'bert-base-uncased',
  inputs: '[MASK] world!'
})

await hf.summarization({
  model: 'facebook/bart-large-cnn',
  inputs:
    'The tower is 324 metres (1,063 ft) tall, about the same height as an 81-storey building, and the tallest structure in Paris. Its base is square, measuring 125 metres (410 ft) on each side. During its construction, the Eiffel Tower surpassed the Washington Monument to become the tallest man-made structure in the world, a title it held for 41 years until the Chrysler Building in New York City was finished in 1930.',
  parameters: {
    max_length: 100
  }
})

await hf.questionAnswer({
  model: 'deepset/roberta-base-squad2',
  inputs: {
    question: 'What is the capital of France?',
    context: 'The capital of France is Paris.'
  }
})

await hf.tableQuestionAnswer({
  model: 'google/tapas-base-finetuned-wtq',
  inputs: {
    query: 'How many stars does the transformers repository have?',
    table: {
      Repository: ['Transformers', 'Datasets', 'Tokenizers'],
      Stars: ['36542', '4512', '3934'],
      Contributors: ['651', '77', '34'],
      'Programming language': ['Python', 'Python', 'Rust, Python and NodeJS']
    }
  }
})

await hf.textClassification({
  model: 'distilbert-base-uncased-finetuned-sst-2-english',
  inputs: 'I like you. I love you.'
})

await hf.textGeneration({
  model: 'gpt2',
  inputs: 'The answer to the universe is'
})

await hf.tokenClassification({
  model: 'dbmdz/bert-large-cased-finetuned-conll03-english',
  inputs: 'My name is Sarah Jessica Parker but you can call me Jessica'
})

await hf.translation({
  model: 't5-base',
  inputs: 'My name is Wolfgang and I live in Berlin'
})

await hf.zeroShotClassification({
  model: 'facebook/bart-large-mnli',
  inputs: [
    'Hi, I recently bought a device from your company but it is not working as advertised and I would like to get reimbursed!'
  ],
  parameters: { candidate_labels: ['refund', 'legal', 'faq'] }
})

await hf.conversational({
  model: 'microsoft/DialoGPT-large',
  inputs: {
    past_user_inputs: ['Which movie is the best ?'],
    generated_responses: ['It is Die Hard for sure.'],
    text: 'Can you explain why ?'
  }
})

await hf.featureExtraction({
  model: 'sentence-transformers/paraphrase-xlm-r-multilingual-v1',
  inputs: {
    source_sentence: 'That is a happy person',
    sentences: [
      'That is a happy dog',
      'That is a very happy person',
      'Today is a sunny day'
    ]
  }
})

// Audio

await hf.automaticSpeechRecognition({
  model: 'facebook/wav2vec2-large-960h-lv60-self',
  data: readFileSync('test/sample1.flac')
})

await hf.audioClassification({
  model: 'superb/hubert-large-superb-er',
  data: readFileSync('test/sample1.flac')
})

// Computer Vision

await hf.imageClassification({
  data: readFileSync('test/cheetah.png'),
  model: 'google/vit-base-patch16-224'
})

await hf.objectDetection({
  data: readFileSync('test/cats.png'),
  model: 'facebook/detr-resnet-50'
})

await hf.imageSegmentation({
  data: readFileSync('test/cats.png'),
  model: 'facebook/detr-resnet-50-panoptic'
})
```

## Supported APIs

### Natural Language Processing

- [x] Fill mask
- [x] Summarization
- [x] Question answering
- [x] Table question answering
- [x] Text classification
- [x] Text generation
- [x] Text2Text generation
- [x] Token classification
- [x] Named entity recognition
- [x] Translation
- [x] Zero-shot classification
- [x] Conversational
- [x] Feature extraction

### Audio

- [x] Automatic speech recognition
- [x] Audio classification

### Computer Vision

- [x] Image classification
- [x] Object detection
- [x] Image segmentation

## Running tests

```console
HF_ACCESS_TOKEN="your access token" npm run test
```

## Options

```typescript
export declare class HfInference {
  private readonly apiKey
  private readonly defaultOptions
  constructor(apiKey: string, defaultOptions?: Options)
  /**
   * Tries to fill in a hole with a missing word (token to be precise). That’s the base task for BERT models.
   */
  fillMask(args: FillMaskArgs, options?: Options): Promise<FillMaskReturn>
  /**
   * This task is well known to summarize longer text into shorter text. Be careful, some models have a maximum length of input. That means that the summary cannot handle full books for instance. Be careful when choosing your model.
   */
  summarization(
    args: SummarizationArgs,
    options?: Options
  ): Promise<SummarizationReturn>
  /**
   * Want to have a nice know-it-all bot that can answer any question?. Recommended model: deepset/roberta-base-squad2
   */
  questionAnswer(
    args: QuestionAnswerArgs,
    options?: Options
  ): Promise<QuestionAnswerReturn>
  /**
   * Don’t know SQL? Don’t want to dive into a large spreadsheet? Ask questions in plain english! Recommended model: google/tapas-base-finetuned-wtq.
   */
  tableQuestionAnswer(
    args: TableQuestionAnswerArgs,
    options?: Options
  ): Promise<TableQuestionAnswerReturn>
  /**
   * Usually used for sentiment-analysis this will output the likelihood of classes of an input. Recommended model: distilbert-base-uncased-finetuned-sst-2-english
   */
  textClassification(
    args: TextClassificationArgs,
    options?: Options
  ): Promise<TextClassificationReturn>
  /**
   * Use to continue text from a prompt. This is a very generic task. Recommended model: gpt2 (it’s a simple model, but fun to play with).
   */
  textGeneration(
    args: TextGenerationArgs,
    options?: Options
  ): Promise<TextGenerationReturn>
  /**
   * Usually used for sentence parsing, either grammatical, or Named Entity Recognition (NER) to understand keywords contained within text. Recommended model: dbmdz/bert-large-cased-finetuned-conll03-english
   */
  tokenClassification(
    args: TokenClassificationArgs,
    options?: Options
  ): Promise<TokenClassificationReturn>
  /**
   * This task is well known to translate text from one language to another. Recommended model: Helsinki-NLP/opus-mt-ru-en.
   */
  translation(
    args: TranslationArgs,
    options?: Options
  ): Promise<TranslationReturn>
  /**
   * This task is super useful to try out classification with zero code, you simply pass a sentence/paragraph and the possible labels for that sentence, and you get a result. Recommended model: facebook/bart-large-mnli.
   */
  zeroShotClassification(
    args: ZeroShotClassificationArgs,
    options?: Options
  ): Promise<ZeroShotClassificationReturn>
  /**
   * This task corresponds to any chatbot like structure. Models tend to have shorter max_length, so please check with caution when using a given model if you need long range dependency or not. Recommended model: microsoft/DialoGPT-large.
   *
   */
  conversational(
    args: ConversationalArgs,
    options?: Options
  ): Promise<ConversationalReturn>
  /**
   * This task reads some text and outputs raw float values, that are usually consumed as part of a semantic database/semantic search.
   */
  featureExtraction(
    args: FeatureExtractionArgs,
    options?: Options
  ): Promise<FeatureExtractionReturn>
  /**
   * This task reads some audio input and outputs the said words within the audio files.
   * Recommended model (english language): facebook/wav2vec2-large-960h-lv60-self
   */
  automaticSpeechRecognition(
    args: AutomaticSpeechRecognitionArgs,
    options?: Options
  ): Promise<AutomaticSpeechRecognitionReturn>
  /**
   * This task reads some audio input and outputs the likelihood of classes.
   * Recommended model:  superb/hubert-large-superb-er
   */
  audioClassification(
    args: AudioClassificationArgs,
    options?: Options
  ): Promise<AudioClassificationReturn>
  /**
   * This task reads some image input and outputs the likelihood of classes.
   * Recommended model: google/vit-base-patch16-224
   */
  imageClassification(
    args: ImageClassificationArgs,
    options?: Options
  ): Promise<ImageClassificationReturn>
  /**
   * This task reads some image input and outputs the likelihood of classes & bounding boxes of detected objects.
   * Recommended model: facebook/detr-resnet-50
   */
  objectDetection(
    args: ObjectDetectionArgs,
    options?: Options
  ): Promise<ObjectDetectionReturn>
  /**
   * This task reads some image input and outputs the likelihood of classes & bounding boxes of detected objects.
   * Recommended model: facebook/detr-resnet-50-panoptic
   */
  imageSegmentation(
    args: ImageSegmentationArgs,
    options?: Options
  ): Promise<ImageSegmentationReturn>
  request(
    args: Args & {
      data?: any
    },
    options?: Options & {
      binary?: boolean
    }
  ): Promise<any>
  private static toArray
}

export declare type Options = {
  /**
   * (Default: false). Boolean to use GPU instead of CPU for inference (requires Startup plan at least).
   */
  use_gpu?: boolean
  /**
   * (Default: true). Boolean. There is a cache layer on the inference API to speedup requests we have already seen. Most models can use those results as is as models are deterministic (meaning the results will be the same anyway). However if you use a non deterministic model, you can set this parameter to prevent the caching mechanism from being used resulting in a real new query.
   */
  use_cache?: boolean
  /**
   * (Default: false) Boolean. If the model is not ready, wait for it instead of receiving 503. It limits the number of requests required to get your inference done. It is advised to only set this flag to true after receiving a 503 error as it will limit hanging in your application to known places.
   */
  wait_for_model?: boolean
  /**
   * (Default: true) Boolean. If a request 503s and wait_for_model is set to false, the request will be retried with the same parameters but with wait_for_model set to true.
   */
  retry_on_error?: boolean
}
export declare type Args = {
  model: string
}
export declare type FillMaskArgs = Args & {
  inputs: string
}
export declare type FillMaskReturn = {
  /**
   * The probability for this token.
   */
  score: number
  /**
   * The id of the token
   */
  token: number
  /**
   * The string representation of the token
   */
  token_str: string
  /**
   * The actual sequence of tokens that ran against the model (may contain special tokens)
   */
  sequence: string
}[]
export declare type SummarizationArgs = Args & {
  /**
   * A string to be summarized
   */
  inputs: string
  parameters?: {
    /**
     * (Default: None). Integer to define the minimum length in tokens of the output summary.
     */
    min_length?: number
    /**
     * (Default: None). Integer to define the maximum length in tokens of the output summary.
     */
    max_length?: number
    /**
     * (Default: None). Integer to define the top tokens considered within the sample operation to create new text.
     */
    top_k?: number
    /**
     * (Default: None). Float to define the tokens that are within the sample operation of text generation. Add tokens in the sample for more probable to least probable until the sum of the probabilities is greater than top_p.
     */
    top_p?: number
    /**
     * (Default: 1.0). Float (0.0-100.0). The temperature of the sampling operation. 1 means regular sampling, 0 means always take the highest score, 100.0 is getting closer to uniform probability.
     */
    temperature?: number
    /**
     * (Default: None). Float (0.0-100.0). The more a token is used within generation the more it is penalized to not be picked in successive generation passes.
     */
    repetition_penalty?: number
    /**
     * (Default: None). Float (0-120.0). The amount of time in seconds that the query should take maximum. Network can cause some overhead so it will be a soft limit.
     */
    max_time?: number
  }
}
export declare type SummarizationReturn = {
  /**
   * The string after translation
   */
  summary_text: string
}
export declare type QuestionAnswerArgs = Args & {
  inputs: {
    question: string
    context: string
  }
}
export declare type QuestionAnswerReturn = {
  /**
   * A string that’s the answer within the text.
   */
  answer: string
  /**
   * A float that represents how likely that the answer is correct
   */
  score: number
  /**
   * The index (string wise) of the start of the answer within context.
   */
  start: number
  /**
   * The index (string wise) of the stop of the answer within context.
   */
  end: number
}
export declare type TableQuestionAnswerArgs = Args & {
  inputs: {
    /**
     * The query in plain text that you want to ask the table
     */
    query: string
    /**
     * A table of data represented as a dict of list where entries are headers and the lists are all the values, all lists must have the same size.
     */
    table: Record<string, string[]>
  }
}
export declare type TableQuestionAnswerReturn = {
  /**
   * The plaintext answer
   */
  answer: string
  /**
   * a list of coordinates of the cells referenced in the answer
   */
  coordinates: number[][]
  /**
   * A list of coordinates of the cells contents
   */
  cells: string[]
  /**
   * The aggregator used to get the answer
   */
  aggregator: string
}
export declare type TextClassificationArgs = Args & {
  /**
   * A string to be classified
   */
  inputs: string
}
export declare type TextClassificationReturn = {
  /**
   * The label for the class (model specific)
   */
  label: string
  /**
   * A floats that represents how likely is that the text belongs to this class.
   */
  score: number
}[]
export declare type TextGenerationArgs = Args & {
  /**
   * A string to be generated from
   */
  inputs: string
  parameters?: {
    /**
     * (Default: None). Integer to define the top tokens considered within the sample operation to create new text.
     */
    top_k?: number
    /**
     * (Default: None). Float to define the tokens that are within the sample operation of text generation. Add tokens in the sample for more probable to least probable until the sum of the probabilities is greater than top_p.
     */
    top_p?: number
    /**
     * (Default: 1.0). Float (0.0-100.0). The temperature of the sampling operation. 1 means regular sampling, 0 means always take the highest score, 100.0 is getting closer to uniform probability.
     */
    temperature?: number
    /**
     * (Default: None). Float (0.0-100.0). The more a token is used within generation the more it is penalized to not be picked in successive generation passes.
     */
    repetition_penalty?: number
    /**
     * (Default: None). Int (0-250). The amount of new tokens to be generated, this does not include the input length it is a estimate of the size of generated text you want. Each new tokens slows down the request, so look for balance between response times and length of text generated.
     */
    max_new_tokens?: number
    /**
     * (Default: None). Float (0-120.0). The amount of time in seconds that the query should take maximum. Network can cause some overhead so it will be a soft limit. Use that in combination with max_new_tokens for best results.
     */
    max_time?: number
    /**
     * (Default: True). Bool. If set to False, the return results will not contain the original query making it easier for prompting.
     */
    return_full_text?: boolean
    /**
     * (Default: 1). Integer. The number of proposition you want to be returned.
     */
    num_return_sequences?: number
    /**
     * (Optional: True). Bool. Whether or not to use sampling, use greedy decoding otherwise.
     */
    do_sample?: boolean
  }
}
export declare type TextGenerationReturn = {
  /**
   * The continuated string
   */
  generated_text: string
}
export declare type TokenClassificationArgs = Args & {
  /**
   * A string to be classified
   */
  inputs: string
  parameters?: {
    /**
     * (Default: simple). There are several aggregation strategies:
     *
     * none: Every token gets classified without further aggregation.
     *
     * simple: Entities are grouped according to the default schema (B-, I- tags get merged when the tag is similar).
     *
     * first: Same as the simple strategy except words cannot end up with different tags. Words will use the tag of the first token when there is ambiguity.
     *
     * average: Same as the simple strategy except words cannot end up with different tags. Scores are averaged across tokens and then the maximum label is applied.
     *
     * max: Same as the simple strategy except words cannot end up with different tags. Word entity will be the token with the maximum score.
     */
    aggregation_strategy?: 'none' | 'simple' | 'first' | 'average' | 'max'
  }
}
export declare type TokenClassificationReturnValue = {
  /**
   * The type for the entity being recognized (model specific).
   */
  entity_group: string
  /**
   * How likely the entity was recognized.
   */
  score: number
  /**
   * The string that was captured
   */
  word: string
  /**
   * The offset stringwise where the answer is located. Useful to disambiguate if word occurs multiple times.
   */
  start: number
  /**
   * The offset stringwise where the answer is located. Useful to disambiguate if word occurs multiple times.
   */
  end: number
}
export declare type TokenClassificationReturn = TokenClassificationReturnValue[]
export declare type TranslationArgs = Args & {
  /**
   * A string to be translated
   */
  inputs: string
}
export declare type TranslationReturn = {
  /**
   * The string after translation
   */
  translation_text: string
}
export declare type ZeroShotClassificationArgs = Args & {
  /**
   * a string or list of strings
   */
  inputs: string | string[]
  parameters: {
    /**
     * a list of strings that are potential classes for inputs. (max 10 candidate_labels, for more, simply run multiple requests, results are going to be misleading if using too many candidate_labels anyway. If you want to keep the exact same, you can simply run multi_label=True and do the scaling on your end.
     */
    candidate_labels: string[]
    /**
     * (Default: false) Boolean that is set to True if classes can overlap
     */
    multi_label?: boolean
  }
}
export declare type ZeroShotClassificationReturnValue = {
  sequence: string
  labels: string[]
  scores: number[]
}
export declare type ZeroShotClassificationReturn =
  ZeroShotClassificationReturnValue[]
export declare type ConversationalArgs = Args & {
  inputs: {
    /**
     * The last input from the user in the conversation.
     */
    text: string
    /**
     * A list of strings corresponding to the earlier replies from the model.
     */
    generated_responses?: string[]
    /**
     * 	A list of strings corresponding to the earlier replies from the user. Should be of the same length of generated_responses.
     */
    past_user_inputs?: string[]
  }
  parameters?: {
    /**
     * (Default: None). Integer to define the minimum length in tokens of the output summary.
     */
    min_length?: number
    /**
     * (Default: None). Integer to define the maximum length in tokens of the output summary.
     */
    max_length?: number
    /**
     * (Default: None). Integer to define the top tokens considered within the sample operation to create new text.
     */
    top_k?: number
    /**
     * (Default: None). Float to define the tokens that are within the sample operation of text generation. Add tokens in the sample for more probable to least probable until the sum of the probabilities is greater than top_p.
     */
    top_p?: number
    /**
     * (Default: 1.0). Float (0.0-100.0). The temperature of the sampling operation. 1 means regular sampling, 0 means always take the highest score, 100.0 is getting closer to uniform probability.
     */
    temperature?: number
    /**
     * (Default: None). Float (0.0-100.0). The more a token is used within generation the more it is penalized to not be picked in successive generation passes.
     */
    repetition_penalty?: number
    /**
     * (Default: None). Float (0-120.0). The amount of time in seconds that the query should take maximum. Network can cause some overhead so it will be a soft limit.
     */
    max_time?: number
  }
}
export declare type ConversationalReturn = {
  generated_text: string
  conversation: {
    generated_responses: string[]
    past_user_inputs: string[]
  }
  warnings: string[]
}
export declare type FeatureExtractionArgs = Args & {
  /**
   * The inputs vary based on the model. For example when using sentence-transformers/paraphrase-xlm-r-multilingual-v1 the inputs will look like this:
   *
   *  inputs: {
   *    "source_sentence": "That is a happy person",
   *    "sentences": ["That is a happy dog", "That is a very happy person", "Today is a sunny day"]
   */
  inputs: Record<string, any> | Record<string, any>[]
}
/**
 * Returned values are a list of floats, or a list of list of floats (depending on if you sent a string or a list of string, and if the automatic reduction, usually mean_pooling for instance was applied for you or not. This should be explained on the model's README.
 */
export declare type FeatureExtractionReturn = (number | number[])[]
export declare type ImageClassificationArgs = Args & {
  /**
   * Binary image data
   */
  data: any
}
export declare type ImageClassificationReturnValue = {
  /**
   * The label for the class (model specific)
   */
  score: number
  /**
   * A float that represents how likely it is that the image file belongs to this class.
   */
  label: string
}
export declare type ImageClassificationReturn = ImageClassificationReturnValue[]
export declare type ObjectDetectionArgs = Args & {
  /**
   * Binary image data
   */
  data: any
}
export declare type ObjectDetectionReturnValue = {
  /**
   * A float that represents how likely it is that the detected object belongs to the given class.
   */
  score: number
  /**
   * The label for the class (model specific) of a detected object.
   */
  label: string
  /**
   * A dict (with keys [xmin,ymin,xmax,ymax]) representing the bounding box of a detected object.
   */
  box: {
    xmin: number
    ymin: number
    xmax: number
    ymax: number
  }
}
export declare type ObjectDetectionReturn = ObjectDetectionReturnValue[]
export declare type ImageSegmentationArgs = Args & {
  /**
   * Binary image data
   */
  data: any
}
export declare type ImageSegmentationReturnValue = {
  /**
   * A float that represents how likely it is that the detected object belongs to the given class.
   */
  score: number
  /**
   * The label for the class (model specific) of a segment.
   */
  label: string
  /**
   * A str (base64 str of a single channel black-and-white img) representing the mask of a segment.
   */
  mask: string
}
export declare type ImageSegmentationReturn = ImageSegmentationReturnValue[]
export declare type AutomaticSpeechRecognitionArgs = Args & {
  /**
   * Binary audio data
   */
  data: any
}
export declare type AutomaticSpeechRecognitionReturn = {
  /**
   * The text that was recognized from the audio
   */
  text: string
}
export declare type AudioClassificationArgs = Args & {
  /**
   * Binary audio data
   */
  data: any
}
export declare type AudioClassificationReturnValue = {
  /**
   * The label for the class (model specific)
   */
  label: string
  /**
   * A float that represents how likely it is that the audio file belongs to this class.
   */
  score: number
}
export declare type AudioClassificationReturn = AudioClassificationReturnValue[]
```
