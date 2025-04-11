import requests

API_URL = "https://router.huggingface.co/hf-inference/models/meta-llama/Llama-3.1-8B-Instruct/v1/chat/completions"
headers = {
    "Authorization": "Bearer api_token",
    "X-HF-Bill-To": "huggingface"
}

def query(payload):
    response = requests.post(API_URL, headers=headers, json=payload)
    return response.json()

response = query({
    "messages": [
        {
            "role": "user",
            "content": "What is the capital of France?"
        }
    ],
    "max_tokens": 512,
    "model": "meta-llama/Llama-3.1-8B-Instruct"
})

print(response["choices"][0]["message"])