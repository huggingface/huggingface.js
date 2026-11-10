import os
from huggingface_hub import InferenceClient

client = InferenceClient(
    provider="fal-ai",
    api_key=os.environ["FAL_AI_API_KEY"],
)

# output is a PIL.Image object
image = client.text_to_image(
    "Astronaut riding a horse",
    model="black-forest-labs/FLUX.1-schnell",
)