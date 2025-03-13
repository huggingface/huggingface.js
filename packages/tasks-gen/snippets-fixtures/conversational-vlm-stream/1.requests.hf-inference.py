import json
import requests

API_URL = "https://router.huggingface.co/hf-inference/models/meta-llama/Llama-3.2-11B-Vision-Instruct/v1/chat/completions"
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
    "model": "meta-llama/Llama-3.2-11B-Vision-Instruct",
    "messages": [
        {
            "role": "user",
            "content": [
                {
                    "type": "text",
                    "text": "Describe this image in one sentence."
                },
                {
                    "type": "image_url",
                    "image_url": {
                        "url": "https://cdn.britannica.com/61/93061-050-99147DCE/Statue-of-Liberty-Island-New-York-Bay.jpg"
                    }
                }
            ]
        }
    ],
    "max_tokens": 500,
    "stream": True,
})

for chunk in chunks:
    print(chunk["choices"][0]["delta"]["content"], end="")