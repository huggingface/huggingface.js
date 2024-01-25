## Use Cases

### Filtering an Image

When filtering for an image, the generated masks might serve as an initial filter to eliminate irrelevant information. For instance, when monitoring vegetation in satellite imaging, mask generation models identify green spots, highlighting the relevant region of the image.

### Masked Image Modelling

Generating masks can be done to facilitate learning, especially in semi- or unsupervised learning. For example, the [BEiT](https://huggingface.co/docs/transformers/model_doc/beit) use image masked patches in the pre-training.

### Human-in-the-loop

For applications where humans are in the loop, masks highlight certain region of images for humans to validate.

## Task Variants

### Segmentation

Image Segmentation divides an image into segments where each pixel in the image is mapped to an object. This task has multiple variants such as instance segmentation, panoptic segmentation and semantic segmentation. You can learn more about segmentation on its [task page](https://huggingface.co/tasks/image-segmentation).

## Inference

```python
from transformers import pipeline
generator =  pipeline("mask-generation", device = 0, points_per_batch = 256)
image_url = "https://huggingface.co/ybelkada/segment-anything/resolve/main/assets/car.png"
outputs = generator(image_url, points_per_batch = 256)

```

## Useful Resources

Would you like to learn more about mask generation? Great! Here you can find some curated resources that you may find helpful!

- [Segment anything model](https://huggingface.co/docs/transformers/main/model_doc/sam)
