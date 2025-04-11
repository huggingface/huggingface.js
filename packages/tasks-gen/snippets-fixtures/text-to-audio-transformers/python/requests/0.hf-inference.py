import requests

API_URL = "https://router.huggingface.co/hf-inference/models/facebook/musicgen-small"
headers = {
    "Authorization": "Bearer api_token",
}

def query(payload):
    response = requests.post(API_URL, headers=headers, json=payload)
    return response.json()

audio, sampling_rate = query({
    "inputs": "liquid drum and bass, atmospheric synths, airy sounds",
})
# You can access the audio with IPython.display for example
from IPython.display import Audio
Audio(audio, rate=sampling_rate)