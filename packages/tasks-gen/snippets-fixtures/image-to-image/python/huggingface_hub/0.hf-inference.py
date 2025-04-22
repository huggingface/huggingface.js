from huggingface_hub import InferenceClient

client = InferenceClient(
    provider="hf-inference",
    api_key="api_token",
)

# output is a PIL.Image object
image = client.image_to_image(
    "cat.png",
    prompt="Turn the cat into a tiger.",
    model="stabilityai/stable-diffusion-xl-refiner-1.0",
)