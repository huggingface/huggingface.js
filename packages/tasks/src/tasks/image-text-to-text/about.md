## Different Types of Vision Language Models

Vision language models come in three types:

- **Base:** Pre-trained models that can be fine-tuned. A good example of base models is the [PaliGemma models family](https://huggingface.co/models?sort=trending&search=google%2Fpaligemma-3b-pt) by Google.
- **Instruction:** Base models fine-tuned on instruction datasets. A good example of instruction fine-tuned models is [idefics2-8b](https://huggingface.co/HuggingFaceM4/idefics2-8b).
- **Chatty/Conversational:** Base models fine-tuned on conversation datasets. A good example of chatty models is [deepseek-vl-7b-chat](https://huggingface.co/deepseek-ai/deepseek-vl-7b-chat).

![VLM uses](https://huggingface.co/datasets/huggingface/documentation-images/resolve/main/blog/vlm/visual.jpg)

## Use Cases

### Multimodal Dialogue

Vision language models can be used as multimodal assistants, keeping context about the conversation and keeping the image to have multiple-turn dialogues.

### Zero-shot Object Detection, Image Segmentation and Localization

Some vision language models can detect or segment a set of objects or describe the positions or relative positions of the objects. For example, one could prompt such a model to ask if one object is behind another. Such a model can also output bounding box coordination or segmentation masks directly in the text output, unlike the traditional models explicitly trained on only object detection or image segmentation.

### Visual Question Answering

Vision language models trained on image-text pairs can be used for visual question answering and generating captions for images.

### Document Question Answering and Retrieval

Documents often consist of different layouts, charts, tables, images, and more. Vision language models trained on formatted documents can extract information from them. This is an OCR-free approach; the inputs skip OCR, and documents are directly fed to vision language models.

### Image Recognition with Instructions

Vision language models can recognize images through descriptions. When given detailed descriptions of specific entities, it can classify the entities in an image.

## Inference

You can use the Transformers library to interact with vision-language models. Specifically, `pipeline` makes it easy to infer models.

Initialize the pipeline first.

```python
from transformers import pipeline

pipe = pipeline("image-text-to-text", model="llava-hf/llava-interleave-qwen-0.5b-hf")
```

We will use chat templates to format the text input. We can also pass the image as URL in context part of the user role in our chat template.

```python
messages = [
     {
         "role": "user",
         "content": [
             {
                 "type": "image",
                 "image": "https://huggingface.co/datasets/huggingface/documentation-images/resolve/main/bee.jpg",
             },
             {"type": "text", "text": "Describe this image."},
         ],
     },
     {
         "role": "assistant",
         "content": [
             {"type": "text", "text": "There's a pink flower"},
         ],
     },
 ]

```

We can now directly pass in the messages to the pipeline to infer. The `return_full_text` flag is used to return the full prompt in the response, including the user input. Here we pass `False` to only return the generated text.

```python
outputs = pipe(text=messages, max_new_tokens=20, return_full_text=False)

outputs[0]["generated_text"]
# with a yellow center in the foreground. The flower is surrounded by red and white flowers with green stems
```

You can also use the Inference API to test image-text-to-text models. You need to use a [Hugging Face token](https://huggingface.co/settings/tokens) for authentication.

```bash
curl https://api-inference.huggingface.co/models/meta-llama/Llama-3.2-11B-Vision-Instruct \
	-X POST \
	-d '{"inputs": "Can you please let us know more details about your "}' \
	-H 'Content-Type: application/json' \
	-H "Authorization: Bearer hf_***"
```

## Useful Resources

- [Vision Language Models Explained](https://huggingface.co/blog/vlms)
- [Open-source Multimodality and How to Achieve it using Hugging Face](https://www.youtube.com/watch?v=IoGaGfU1CIg&t=601s)
- [Introducing Idefics2: A Powerful 8B Vision-Language Model for the community](https://huggingface.co/blog/idefics2)
- [Image-text-to-text task guide](https://huggingface.co/tasks/image-text-to-text)
- [Preference Optimization for Vision Language Models with TRL](https://huggingface.co/blog/dpo_vlm)
