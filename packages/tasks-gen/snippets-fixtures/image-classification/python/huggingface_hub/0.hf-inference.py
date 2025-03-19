from huggingface_hub import InferenceClient

client = InferenceClient(
    provider="hf-inference",
    api_key="api_token",
)

output = client.image_classification("cats.jpg", model="Falconsai/nsfw_image_detection")