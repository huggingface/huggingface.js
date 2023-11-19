## Use Cases

Video classification models can be used to categorize what a video is all about.

### Activity Recognition

Video classification models are used to perform activity recognition which is useful for fitness applications. Activity recognition is also helpful for vision-impaired individuals especially when they're commuting.

### Video Search

Models trained in video classification can improve user experience by organizing and categorizing video galleries on the phone or in the cloud, on multiple keywords or tags.

## Inference

Below you can find code for inferring with a pre-trained video classification model.

```python
from transformers import VideoMAEFeatureExtractor, VideoMAEForVideoClassification
from pytorchvideo.transforms import UniformTemporalSubsample
from pytorchvideo.data.encoded_video import EncodedVideo


# Load the video.
video = EncodedVideo.from_path("path_to_video.mp4")
video_data = video.get_clip(start_sec=0, end_sec=4.0)["video"]

# Sub-sample a fixed set of frames and convert them to a NumPy array.
num_frames = 16
subsampler = UniformTemporalSubsample(num_frames)
subsampled_frames = subsampler(video_data)
video_data_np = subsampled_frames.numpy().transpose(1, 2, 3, 0)

# Preprocess the video frames.
inputs = feature_extractor(list(video_data_np), return_tensors="pt")

# Run inference
with torch.no_grad():
    outputs = model(**inputs)
    logits = outputs.logits

# Model predicts one of the 400 Kinetics 400 classes
predicted_label = logits.argmax(-1).item()
print(model.config.id2label[predicted_label])
# `eating spaghetti` (if you chose this video:
# https://hf.co/datasets/nielsr/video-demo/resolve/main/eating_spaghetti.mp4)
```

## Useful Resources

- [Developing a simple video classification model](https://keras.io/examples/vision/video_classification)
- [Video classification with Transformers](https://keras.io/examples/vision/video_transformers)
- [Building a video archive](https://www.youtube.com/watch?v=_IeS1m8r6SY)
- [Video classification task guide](https://huggingface.co/docs/transformers/tasks/video_classification)

### Creating your own video classifier in minutes

- [Fine-tuning tutorial notebook (PyTorch)](https://colab.research.google.com/github/huggingface/notebooks/blob/main/examples/video_classification.ipynb)
