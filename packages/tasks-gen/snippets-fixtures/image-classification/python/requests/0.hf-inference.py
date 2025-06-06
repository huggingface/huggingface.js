import os
import requests

API_URL = "https://router.huggingface.co/hf-inference/models/Falconsai/nsfw_image_detection"
headers = {
    "Authorization": f"Bearer {os.environ['HF_TOKEN']}",
}

def query(filename):
    with open(filename, "rb") as f:
        data = f.read()
    response = requests.post(API_URL, headers={"Content-Type": "image/jpeg", **headers}, data=data)
    return response.json()

output = query("cats.jpg")