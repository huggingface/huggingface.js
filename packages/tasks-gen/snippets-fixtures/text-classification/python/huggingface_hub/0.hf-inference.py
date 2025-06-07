import os
from huggingface_hub import InferenceClient

client = InferenceClient(
    provider="hf-inference",
    api_key=os.environ["HF_TOKEN"],
)

result = client.text_classification(
    "I like you. I love you",
    model="distilbert/distilbert-base-uncased-finetuned-sst-2-english",
)