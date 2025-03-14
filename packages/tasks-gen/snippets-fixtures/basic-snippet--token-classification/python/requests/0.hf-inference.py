import requests

API_URL = "https://router.huggingface.co/hf-inference/models/FacebookAI/xlm-roberta-large-finetuned-conll03-english"
headers = {"Authorization": "Bearer api_token"}

def query(payload):
    response = requests.post(API_URL, headers=headers, json=payload)
    return response.json()

output = query({
    "inputs": "My name is Sarah Jessica Parker but you can call me Jessica",
})