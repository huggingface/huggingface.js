import os
from huggingface_hub import InferenceClient

client = InferenceClient(
    provider="replicate",
    api_key=os.environ["HF_TOKEN"],
)

video = client.text_to_video(
    "A young man walking on the street",
    model="tencent/HunyuanVideo",
)