## About the task

Zero-shot object detection is a computer vision task to detect objects and its class in images, without any prior training or knowledge of the classes.

Zero shot object detection works by transferring knowledge learnt during training of one model, to classify novel classes that was not present in the training data.

## Use Cases

### Object Search

Zero-shot object detection models can be used in image search. Smartphones use zero-shot object detection models to detect entities (such as specific places or objects) and allow the user to search for the entity on the internet.

### Object Counting

Zero-shot object detection models are used to count instances of objects in a given image. This can include counting the objects in warehouses or stores or the number of visitors in a store. They are also used to manage crowds at events to prevent disasters.

## Inference

You can infer with zero-shot object detection models through the `zero-shot-object-detection` pipeline. When calling the pipeline, you just need to specify a path or HTTP link to an image and the candidate labels.

```python
detector = pipeline(model="google/owlvit-base-patch32", task="zero-shot-object-detection")

predictions = detector(
    image,
    candidate_labels=["a photo of a cat", "a photo of a dog"],
)

# [{'score': 0.95,
#   'label': 'a photo of a cat',
#   'box': {'xmin': 180, 'ymin': 71, 'xmax': 271, 'ymax': 178}},
#   ...
# ]
```

# Useful Resources

- [Zero-shot object detection task guide](https://huggingface.co/tasks/zero-shot-object-detection)
