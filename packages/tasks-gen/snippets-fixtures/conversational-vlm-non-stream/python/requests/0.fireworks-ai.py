import requests

API_URL = "https://api.fireworks.ai/inference/v1/chat/completions"
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
    "max_tokens": 512,
    "model": "<fireworks-ai alias for meta-llama/Llama-3.2-11B-Vision-Instruct>"
})

print(response["choices"][0]["message"])