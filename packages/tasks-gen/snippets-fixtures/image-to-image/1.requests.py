import base64
import requests

API_URL = "https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-xl-refiner-1.0"
headers = {"Authorization": "Bearer api_token"}

def query(payload):
	with open(payload["inputs"], "rb") as f:
		img = f.read()
		payload["inputs"] = base64.b64encode(img).decode("utf-8")
	response = requests.post(API_URL, headers=headers, json=payload)
	return response.content

image_bytes = query({
	"inputs": "cat.png",
	"parameters": {"prompt": "Turn the cat into a tiger."},
})

# You can access the image with PIL.Image for example
import io
from PIL import Image
image = Image.open(io.BytesIO(image_bytes))