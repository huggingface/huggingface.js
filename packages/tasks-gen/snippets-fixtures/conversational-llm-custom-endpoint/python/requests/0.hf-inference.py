import os
import requests

API_URL = "http://localhost:8080/v1/chat/completions"
headers = {
    "Authorization": f"Bearer {os.environ['API_TOKEN']}",
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
    "model": "meta-llama/Llama-3.1-8B-Instruct"
})

print(response["choices"][0]["message"])