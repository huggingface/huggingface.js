## Use Cases

Models trained on a specific dataset can learn very shallow features about the data. For instance, a model trained on English poetry dataset learns English grammar on a very high level. This information can be transferred to a new model that is going to be trained on tweets. This way of extracting features and transferring to a model is called feature extraction. One can pass their dataset through a feature extraction pipeline and feed the result to a classifier directly.

## Inference

```python
from transformers import pipeline
checkpoint = "facebook/bart-base"
feature_extractor = pipeline("feature-extraction", framework="pt", model=checkpoint)
text = "Transformers is an awesome library!"

#Reducing along the first dimension to get a 768 dimensional array
feature_extractor(text,return_tensors = "pt")[0].numpy().mean(axis=0)

'''tensor([[[ 2.5834,  2.7571,  0.9024,  ...,  1.5036, -0.0435, -0.8603],
         [-1.2850, -1.0094, -2.0826,  ...,  1.5993, -0.9017,  0.6426],
         [ 0.9082,  0.3896, -0.6843,  ...,  0.7061,  0.6517,  1.0550],
         ...,
         [ 0.6919, -1.1946,  0.2438,  ...,  1.3646, -1.8661, -0.1642],
         [-0.1701, -2.0019, -0.4223,  ...,  0.3680, -1.9704, -0.0068],
         [ 0.2520, -0.6869, -1.0582,  ...,  0.5198, -2.2106,  0.4547]]])'''
```

## Useful resources

- [Documentation for feature extractor of 🤗Transformers](https://huggingface.co/docs/transformers/main_classes/feature_extractor)
