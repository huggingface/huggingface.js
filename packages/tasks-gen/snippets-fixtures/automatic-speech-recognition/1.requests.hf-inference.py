import requests

API_URL = "https://router.huggingface.co/hf-inference/models/openai/whisper-large-v3-turbo"
headers = {"Authorization": "Bearer api_token"}

def query(filename):
	with open(filename, "rb") as f:
		data = f.read()
	response = requests.post(API_URL, headers=headers, data=data)
	return response.json()

output = query("sample1.flac")