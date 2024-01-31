## Use Cases

### Data Generation

Businesses can generate data for their their use cases by inputting text and getting image outputs.

### Immersive Conversational Chatbots

Chatbots can be made more immersive if they provide contextual images based on the input provided by the user.

### Creative Ideas for Fashion Industry

Different patterns can be generated to obtain unique pieces of fashion. Text-to-image models make creations easier for designers to conceptualize their design before actually implementing it.

### Architecture Industry

Architects can utilise the models to construct an environment based out on the requirements of the floor plan. This can also include the furniture that has to be placed in that environment.

## Task Variants

You can contribute variants of this task [here](https://github.com/huggingface/hub-docs/blob/main/tasks/src/text-to-image/about.md).

## Inference

You can use diffusers pipelines to infer with `text-to-image` models.

```python
from diffusers import StableDiffusionPipeline, EulerDiscreteScheduler

model_id = "stabilityai/stable-diffusion-2"
scheduler = EulerDiscreteScheduler.from_pretrained(model_id, subfolder="scheduler")
pipe = StableDiffusionPipeline.from_pretrained(model_id, scheduler=scheduler, torch_dtype=torch.float16)
pipe = pipe.to("cuda")

prompt = "a photo of an astronaut riding a horse on mars"
image = pipe(prompt).images[0]
```

You can use [huggingface.js](https://github.com/huggingface/huggingface.js) to infer text-to-image models on Hugging Face Hub.

```javascript
import { HfInference } from "@huggingface/inference";

const inference = new HfInference(HF_TOKEN);
await inference.textToImage({
	model: "stabilityai/stable-diffusion-2",
	inputs: "award winning high resolution photo of a giant tortoise/((ladybird)) hybrid, [trending on artstation]",
	parameters: {
		negative_prompt: "blurry",
	},
});
```

## Useful Resources

### Model Inference

- [Hugging Face Diffusion Models Course](https://github.com/huggingface/diffusion-models-class)
- [Getting Started with Diffusers](https://huggingface.co/docs/diffusers/index)
- [Text-to-Image Generation](https://huggingface.co/docs/diffusers/using-diffusers/conditional_image_generation)
- [Using Stable Diffusion with Core ML on Apple Silicon](https://huggingface.co/blog/diffusers-coreml)
- [A guide on Vector Quantized Diffusion](https://huggingface.co/blog/vq-diffusion)
- [🧨 Stable Diffusion in JAX/Flax](https://huggingface.co/blog/stable_diffusion_jax)
- [Running IF with 🧨 diffusers on a Free Tier Google Colab](https://huggingface.co/blog/if)
- [Introducing Würstchen: Fast Diffusion for Image Generation](https://huggingface.co/blog/wuerstchen)
- [Efficient Controllable Generation for SDXL with T2I-Adapters](https://huggingface.co/blog/t2i-sdxl-adapters)
- [Welcome aMUSEd: Efficient Text-to-Image Generation](https://huggingface.co/blog/amused)

### Model Fine-tuning

- [Finetune Stable Diffusion Models with DDPO via TRL](https://huggingface.co/blog/pref-tuning)
- [LoRA training scripts of the world, unite!](https://huggingface.co/blog/sdxl_lora_advanced_script)
- [Using LoRA for Efficient Stable Diffusion Fine-Tuning](https://huggingface.co/blog/lora)

This page was made possible thanks to the efforts of [Ishan Dutta](https://huggingface.co/ishandutta), [Enrique Elias Ubaldo](https://huggingface.co/herrius) and [Oğuz Akif](https://huggingface.co/oguzakif).
