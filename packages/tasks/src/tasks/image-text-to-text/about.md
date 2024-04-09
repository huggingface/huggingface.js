## Use Cases

### Multimodal Dialogue

Vision language models can be used as multimodal assistants, keeping context about the conversation and keeping the image to have multiple turn dialogues.

### Image Recognition with Instructions

Vision language models can recognize images through descriptions. When given detailed descriptions of specific entities, it can classify the entities in an image.

### Zero-shot Object Detection, Image Segmentation and Localization

Some vision language models can detect or segment a set of objects or describe the positions or relative positions of the objects. For example, one could prompt such a model to ask if one object is behind another. Such a model can also output bounding box coordination or segmentation masks directly in the text output, unlike the traditional models explicitly trained on only doing object detection or image segmentation.

### Visual Question Answering

Vision language models trained on image-text pairs can be used for visual question answering.

### Document Question Answering and Retrieval

Vision language models trained on formatted documents that include text and graphics can extract information from documents. This includes OCR-free retrieval as well, where one can directly feed an image without putting the image through OCR and feeding the text.

### Image Captioning

Vision language models can be used to generate captions for images.

## Inference

You can use the Transformers library's `image-text-to-text` pipeline to interact with vision-language models.

```python
from transformers import pipeline

mm_pipeline = pipeline("image-text-to-text", model="microsoft/kosmos-2-patch14-224")

generated_text = mm_pipeline(images="https://huggingface.co/spaces/llava-hf/llava-4bit/resolve/main/examples/baklava.png", text="How to make this pastry?", max_new_tokens=50)
## [{'generated_text': 'How to make this pastry? 1. Preheat oven to 200 degrees Celsius.'}]
```

## Useful Resources

- [Breaking resolution curse of vision-language models](https://huggingface.co/blog/visheratin/vlm-resolution-curse)
- [A Dive into Vision Language Models](https://huggingface.co/blog/vision_language_pretraining)
