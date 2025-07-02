import os
import base64
import requests

API_URL = "https://router.huggingface.co/hf-inference/models/black-forest-labs/FLUX.1-Kontext-dev"
headers = {
    "Authorization": f"Bearer {os.environ['HF_TOKEN']}",
}

with open("cat.png", "rb") as image_file:
    image_base_64 = base64.b64encode(image_file.read()).decode('utf-8')

def query(payload):
    with open(payload["inputs"], "rb") as f:
        img = f.read()
        payload["inputs"] = base64.b64encode(img).decode("utf-8")
    response = requests.post(API_URL, headers=headers, json=payload)
    return response.content

image_bytes = query({
    "inputs": "cat.png",
    "parameters": {
        "prompt": "Turn the cat into a tiger."
    }
})

# You can access the image with PIL.Image for example
import io
from PIL import Image
image = Image.open(io.BytesIO(image_bytes))