from huggingface_hub import InferenceClient, get_token

client = InferenceClient(
    provider="fal-ai",
    api_key=get_token(),
)

with open("cat.png", "rb") as image_file:
   input_image = image_file.read()

# output is a PIL.Image object
image = client.image_to_image(
    input_image,
    prompt="Turn the cat into a tiger.",
    model="black-forest-labs/FLUX.1-Kontext-dev",
)