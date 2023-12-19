## Use Cases

### Image Captioning

Image Captioning is the process of generating textual description of an image.
This can help the visually impaired people to understand what's happening in their surroundings.

### Optical Character Recognition (OCR)

OCR models convert the text present in an image, e.g. a scanned document, to text.

## Pix2Struct

Pix2Struct is a state-of-the-art model built and released by Google AI. The model itself has to be trained on a downstream task to be used. These tasks include, captioning UI components, images including text, visual questioning infographics, charts, scientific diagrams and more. You can find these models on recommended models of this page.

## Inference

### Image Captioning

You can use the 🤗 Transformers library's `image-to-text` pipeline to generate caption for the Image input.

```python
from transformers import pipeline

captioner = pipeline("image-to-text",model="Salesforce/blip-image-captioning-base")
captioner("https://huggingface.co/datasets/Narsil/image_dummy/resolve/main/parrots.png")
## [{'generated_text': 'two birds are standing next to each other '}]
```

### Conversation with the Image

Some text generation models also take image inputs. These are called multimodal language models. You can use `image-to-text` pipeline to use these models like below.

```python
from transformers import pipeline

mm_pipeline = pipeline("image-to-text",model="llava-hf/llava-1.5-7b-hf")
mm_pipeline("https://huggingface.co/spaces/llava-hf/llava-4bit/resolve/main/examples/baklava.png", "How to make this pastry?")

## [{'generated_text': 'To create these pastries, you will need a few key ingredients and tools. Firstly, gather the dough by combining flour with water in your mixing bowl until it forms into an elastic ball that can be easily rolled out on top of another surface or table without breaking apart (like pizza).'}]
```

### OCR

This code snippet uses Microsoft’s TrOCR, an encoder-decoder model consisting of an image Transformer encoder and a text Transformer decoder for state-of-the-art optical character recognition (OCR) on single-text line images.

```python
from transformers import TrOCRProcessor, VisionEncoderDecoderModel

processor = TrOCRProcessor.from_pretrained('microsoft/trocr-base-handwritten')
model = VisionEncoderDecoderModel.from_pretrained('microsoft/trocr-base-handwritten')
pixel_values = processor(images="image.jpeg", return_tensors="pt").pixel_values

generated_ids = model.generate(pixel_values)
generated_text = processor.batch_decode(generated_ids, skip_special_tokens=True)[0]

```

You can use [huggingface.js](https://github.com/huggingface/huggingface.js) to infer image-to-text models on Hugging Face Hub.

```javascript
import { HfInference } from "@huggingface/inference";

const inference = new HfInference(HF_TOKEN);
await inference.imageToText({
	data: await (await fetch("https://picsum.photos/300/300")).blob(),
	model: "Salesforce/blip-image-captioning-base",
});
```

## Useful Resources

- [Image Captioning](https://huggingface.co/docs/transformers/main/en/tasks/image_captioning)
- [Image captioning use case](https://blog.google/outreach-initiatives/accessibility/get-image-descriptions/)
- [Train Image Captioning model on your dataset](https://github.com/NielsRogge/Transformers-Tutorials/blob/master/GIT/Fine_tune_GIT_on_an_image_captioning_dataset.ipynb)
- [Train OCR model on your dataset ](https://github.com/NielsRogge/Transformers-Tutorials/tree/master/TrOCR)

This page was made possible thanks to efforts of [Sukesh Perla](https://huggingface.co/hitchhiker3010) and [Johannes Kolbe](https://huggingface.co/johko).
