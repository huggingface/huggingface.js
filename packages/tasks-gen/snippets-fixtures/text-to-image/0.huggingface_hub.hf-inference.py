from huggingface_hub import InferenceClient

client = InferenceClient(
	provider="hf-inference",
	api_key="api_token"
)

# output is a PIL.Image object
image = client.text_to_image(
	"Astronaut riding a horse",
	model="black-forest-labs/FLUX.1-schnell"
)