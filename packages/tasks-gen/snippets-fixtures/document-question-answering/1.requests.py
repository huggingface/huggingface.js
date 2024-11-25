import base64
import requests

API_URL = "https://api-inference.huggingface.co/models/impira/layoutlm-invoices"
headers = {"Authorization": "Bearer api_token"}

def query(payload):
	with open(payload["image"], "rb") as f:
		img = f.read()
		payload["image"] = base64.b64encode(img).decode("utf-8")
	response = requests.post(API_URL, headers=headers, json=payload)
	return response.json()

output = query({
    "inputs": {
		"image": "cat.png",
		"question": "What is in this image?"
	},
})