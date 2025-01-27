import requests

API_URL = "https://api-inference.huggingface.co/models/black-forest-labs/FLUX.1-schnell"
headers = {"Authorization": "Bearer api_token"}

def query(payload):
	response = requests.post(API_URL, headers=headers, json=payload)
	return response.content

image_bytes = query({
	"inputs": "Astronaut riding a horse",
})

# You can access the image with PIL.Image for example
import io
from PIL import Image
image = Image.open(io.BytesIO(image_bytes))