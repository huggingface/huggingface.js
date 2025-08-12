import requests

API_URL = "https://router.huggingface.co/v1/chat/completions"
headers = {
    "Authorization": "Bearer hf_xxx",
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
    "model": "meta-llama/Llama-3.1-8B-Instruct:hf-inference"
})

print(response["choices"][0]["message"])