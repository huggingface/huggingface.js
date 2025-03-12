import requests

API_URL = "https://router.huggingface.co/hf-inference/models/meta-llama/Llama-3.1-8B-Instruct/v1/chat/completions"
headers = {"Authorization": "Bearer api_token"}

def query(payload):
    response = requests.post(API_URL, headers=headers, json=payload)
    return response.json()

response = query({
    "model": "meta-llama/Llama-3.1-8B-Instruct",
    "messages": [
        {
            "role": "user",
            "content": "What is the capital of France?"
        }
    ],
    "max_tokens": 500
})

print(response["choices"][0]["message"])