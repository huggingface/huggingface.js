## Use Cases

### Visual Question Answering

Vision language models trained on image text prompt pairs can be used for visual question answering.

## Document Question Answering and Retrieval

Vision language models trained on document text, layout and graphics can be used to extract information from documents.

### Image Captioning

Vision language models can be used to generate captions for images.

## Inference

You can use the 🤗 Transformers library's `image-text-to-text` pipeline to interact with vision language models.

```python
from transformers import pipeline
import torch 

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
mm_pipeline = pipeline("image-text-to-text", model="microsoft/kosmos-2-patch14-224", device=device)

generated_text = mm_pipeline(images="https://huggingface.co/spaces/llava-hf/llava-4bit/resolve/main/examples/baklava.png", text="How to make this pastry?", max_new_tokens=50)
## [{'generated_text': 'How to make this pastry? 1. Preheat oven to 200 degrees Celsius.'}]
```

## Useful Resources
- [Breaking resolution curse of vision-language models](https://huggingface.co/blog/visheratin/vlm-resolution-curse)
- [A Dive into Vision Language Models](https://huggingface.co/blog/vision_language_pretraining)