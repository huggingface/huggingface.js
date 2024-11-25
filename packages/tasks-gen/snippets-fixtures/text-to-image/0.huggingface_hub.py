from huggingface_hub import InferenceClient
client = InferenceClient("black-forest-labs/FLUX.1-schnell", token="api_token")

# output is a PIL.Image object
image = client.text_to_image("Astronaut riding a horse")