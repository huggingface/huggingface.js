import requests

API_URL = "https://router.huggingface.co/hf-inference"
headers = {"Authorization": "Bearer api_token"}

def query(payload):
	response = requests.post(API_URL, headers=headers, json=payload)
	return response.json()
	
output = query({
	"inputs": "I like you. I love you",
})