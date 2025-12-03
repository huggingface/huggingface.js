## Use Cases

### Instruction-based Image Editing

Image-text-to-image models can be used to edit images based on natural language instructions. For example, you can provide an image of a summer landscape and the instruction "Make it winter, add snow" to generate a winter version of the same scene.

### Style Transfer

These models can apply artistic styles or transformations to images based on text descriptions. For instance, you can transform a photo into a painting style by providing prompts like "Make it look like a Van Gogh painting" or "Convert to watercolor style."

### Image Variations

Generate variations of an existing image by providing different text prompts. This is useful for creative workflows where you want to explore different versions of the same image with specific modifications.

### Guided Image Generation

Use a reference image along with text prompts to guide the generation process. This allows for more controlled image generation compared to text-to-image models alone, as the reference image provides structural guidance.

### Image Inpainting and Outpainting

Fill in missing or masked parts of an image based on text descriptions, or extend an image beyond its original boundaries with text-guided generation.

## Task Variants

### Instruction-based Editing

Models that follow natural language instructions to edit images, which can perform complex edits like object removal, color changes, and compositional modifications.

### Reference-guided Generation

Models that use a reference image to guide the generation process while incorporating text prompts to control specific attributes or modifications.

### Conditional Image-to-Image

Models that perform specific transformations based on text conditions, such as changing weather conditions, time of day, or seasonal variations.

## Inference

You can use the Diffusers library to interact with image-text-to-image models.

```python
from diffusers import FluxControlPipeline
from PIL import Image
import torch

# Load the model
pipe = FluxControlPipeline.from_pretrained(
    "black-forest-labs/FLUX.2-dev",
    torch_dtype=torch.bfloat16
).to("cuda")

# Load input image
image = Image.open("input.jpg").convert("RGB")

# Edit the image with a text prompt
prompt = "Make it a snowy winter scene"
edited_image = pipe(prompt=prompt, image=image).images[0]
edited_image.save("edited_image.png")
```

## Useful Resources

- [FLUX.2 Model Card](https://huggingface.co/black-forest-labs/FLUX.2-dev)
- [Diffusers documentation on Image-to-Image](https://huggingface.co/docs/diffusers/using-diffusers/img2img)
- [ControlNet for Conditional Image Generation](https://huggingface.co/docs/diffusers/using-diffusers/controlnet)
