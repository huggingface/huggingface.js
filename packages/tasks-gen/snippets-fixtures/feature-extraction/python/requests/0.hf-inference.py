import requests

API_URL = "https://router.huggingface.co/hf-inference/models/intfloat/multilingual-e5-large-instruct/pipeline/feature-extraction"
headers = {
    "Authorization": "Bearer api_token",
}

def query(payload):
    response = requests.post(API_URL, headers=headers, json=payload)
    return response.json()

output = query({
    "inputs": "Today is a sunny day and I will get some ice cream.",
})