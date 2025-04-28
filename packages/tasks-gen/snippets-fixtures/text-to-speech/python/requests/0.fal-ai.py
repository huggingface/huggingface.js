import requests

API_URL = "https://fal.run/<fal-ai alias for nari-labs/Dia-1.6B>"
headers = {
    "Authorization": "Key api_token",
}

def query(payload):
    response = requests.post(API_URL, headers=headers, json=payload)
    return response.json()

audio, sampling_rate = query({
    "text": "The answer to the universe is 42",
})
# You can access the audio with IPython.display for example
from IPython.display import Audio
Audio(audio, rate=sampling_rate)