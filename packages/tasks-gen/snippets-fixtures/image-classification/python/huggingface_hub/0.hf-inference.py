import os
from huggingface_hub import InferenceClient

client = InferenceClient(
    provider="hf-inference",
    api_key=os.getenv("HF_TOKEN"),
)

output = client.image_classification("cats.jpg", model="Falconsai/nsfw_image_detection")