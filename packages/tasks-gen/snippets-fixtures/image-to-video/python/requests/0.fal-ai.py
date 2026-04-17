import os
import base64
import requests

API_URL = "https://router.huggingface.co/fal-ai/<fal-ai alias for Wan-AI/Wan2.2-I2V-A14B>?_subdomain=queue"
headers = {
    "Authorization": f"Bearer {os.environ['HF_TOKEN']}",
}

def query(payload):
    with open(payload["inputs"], "rb") as f:
        img = f.read()
        payload["inputs"] = base64.b64encode(img).decode("utf-8")
    response = requests.post(API_URL, headers=headers, json=payload)
    return response.content

video_bytes = query({
    "inputs": "cat.png",
    "parameters": {
        "prompt": "The cat starts to dance"
    }
})