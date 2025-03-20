import json
import requests

API_URL = "https://router.huggingface.co/hf-inference/models/meta-llama/Llama-3.1-8B-Instruct/v1/chat/completions"
headers = {"Authorization": "Bearer api_token"}

def query(payload):
    response = requests.post(API_URL, headers=headers, json=payload, stream=True)
    for line in response.iter_lines():
        if not line.startswith(b"data:"):
            continue
        if line.strip() == b"data: [DONE]":
            return
        yield json.loads(line.decode("utf-8").lstrip("data:").rstrip("/n"))

chunks = query({
    "messages": [
        {
            "role": "user",
            "content": "What is the capital of France?"
        }
    ],
    "max_tokens": 500,
    "model": "meta-llama/Llama-3.1-8B-Instruct",
    "stream": True,
})

for chunk in chunks:
    print(chunk["choices"][0]["delta"]["content"], end="")