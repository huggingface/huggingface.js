import os
import requests

API_URL = "https://openrouter.ai/api/v1/chat/completions"
headers = {
    "Authorization": f"Bearer {os.environ['OPENROUTER_API_KEY']}",
}

def query(payload):
    response = requests.post(API_URL, headers=headers, json=payload)
    return response.json()

response = query({
    "model": "<openrouter alias for meta-llama/Llama-3.1-8B-Instruct>",
    "messages": [
        {
            "role": "user",
            "content": "What is the capital of France?"
        }
    ]
})

print(response["choices"][0]["message"])