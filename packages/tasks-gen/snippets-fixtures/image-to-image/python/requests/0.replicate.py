import os
import base64
import requests

API_URL = "https://router.huggingface.co/replicate/v1/models/<replicate alias for black-forest-labs/FLUX.1-Kontext-dev>/predictions"
headers = {
    "Authorization": f"Bearer {os.environ['HF_TOKEN']}",
}

def query(payload):
    with open(payload["inputs"], "rb") as f:
        img = f.read()
        payload["inputs"] = base64.b64encode(img).decode("utf-8")
    response = requests.post(API_URL, headers=headers, json=payload)
    return response.content

image_bytes = query({
    "input": {
        "prompt": "Turn the cat into a tiger.",
        "image": "cat.png",
        "images": [
            "cat.png"
        ],
        "input_image": "cat.png",
        "input_images": [
            "cat.png"
        ]
    }
})

# You can access the image with PIL.Image for example
import io
from PIL import Image
image = Image.open(io.BytesIO(image_bytes))