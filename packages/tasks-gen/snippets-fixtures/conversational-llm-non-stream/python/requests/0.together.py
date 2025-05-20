import requests

API_URL = "https://api.together.xyz/v1/chat/completions"
headers = {
    "Authorization": "Bearer api_token",
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
    "model": "<together alias for meta-llama/Llama-3.1-8B-Instruct>"
})

print(response["choices"][0]["message"])