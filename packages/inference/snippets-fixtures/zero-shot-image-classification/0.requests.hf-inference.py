import base64

import requests

API_URL = "https://router.huggingface.co/hf-inference/models/openai/clip-vit-large-patch14"
headers = {"Authorization": "Bearer api_token"}

def query(data):
	with open(data["image_path"], "rb") as f:
		img = f.read()
	payload={
		"parameters": data["parameters"],
		"inputs": base64.b64encode(img).decode("utf-8")
	}
	response = requests.post(API_URL, headers=headers, json=payload)
	return response.json()

output = query({
	"image_path": "cats.jpg",
	"parameters": {"candidate_labels": ["cat", "dog", "llama"]},
})