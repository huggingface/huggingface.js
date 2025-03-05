from huggingface_hub import InferenceClient

client = InferenceClient(
    provider="fal-ai",
    api_key="api_token",
    model="black-forest-labs/FLUX.1-schnell",
)

# output is a PIL.Image object
image = client.text_to_image(
	"Astronaut riding a horse"
)