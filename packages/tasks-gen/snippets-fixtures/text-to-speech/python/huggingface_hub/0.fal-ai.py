import os
from huggingface_hub import InferenceClient

client = InferenceClient(
    provider="fal-ai",
    api_key=os.environ["HF_TOKEN"],
)

# audio is returned as bytes
audio = client.text_to_speech(
    "The answer to the universe is 42",
    model="nari-labs/Dia-1.6B",
)