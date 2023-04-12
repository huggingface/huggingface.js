# 🤗 Hugging Face Inference API

A Typescript powered wrapper for the Hugging Face Inference API. Learn more about the Inference API at [Hugging Face](https://huggingface.co/docs/api-inference/index).

Check out the [full documentation](https://huggingface.co/docs/huggingface.js/inference/README) or try out a live [interactive notebook](https://observablehq.com/@huggingface/hello-huggingface-js-inference).

## Install

```console
npm install @huggingface/inference

yarn add @huggingface/inference

pnpm add @huggingface/inference
```

## Usage

❗**Important note:** Using an API key is optional to get started, however you will be rate limited eventually. Join [Hugging Face](https://huggingface.co/join) and then visit [access tokens](https://huggingface.co/settings/tokens) to generate your API key for **free**.

Your API key should be kept private. If you need to protect it in front-end applications, we suggest setting up a proxy server that stores the API key.

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

for await (const output of hf.textGenerationStream({
  model: "google/flan-t5-xxl",
  inputs: 'repeat "one two three four"',
  parameters: { max_new_tokens: 250 }
})) {
  console.log(output.token.text, output.generated_text);
}

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

await hf.textToImage({
  inputs: 'award winning high resolution photo of a giant tortoise/((ladybird)) hybrid, [trending on artstation]',
  model: 'stabilityai/stable-diffusion-2',
  parameters: {
    negative_prompt: 'blurry',
  }
})

await hf.imageToText({
  data: readFileSync('test/cats.png'),
  model: 'nlpconnect/vit-gpt2-image-captioning'
})
```

## Supported Tasks

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
- [x] Text to image
- [x] Image to text

## Running tests

```console
HF_ACCESS_TOKEN="your access token" npm run test
```

## Finding appropriate models

We have an informative documentation project called [Tasks](https://huggingface.co/tasks) to list available models for each task and explain how each task works in detail.

It also contains demos, example outputs, and other resources should you want to dig deeper into the ML side of things.
