from huggingface_hub import InferenceClient, get_token

client = InferenceClient(
    provider="hf-inference",
    api_key=get_token(),
)

output = client.image_classification("cats.jpg", model="Falconsai/nsfw_image_detection")