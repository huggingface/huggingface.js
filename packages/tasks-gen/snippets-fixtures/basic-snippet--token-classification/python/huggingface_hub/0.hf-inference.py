import os
from huggingface_hub import InferenceClient

client = InferenceClient(
    provider="hf-inference",
    api_key=os.environ["HF_TOKEN"],
)

result = client.token_classification(
    "My name is Sarah Jessica Parker but you can call me Jessica",
    model="FacebookAI/xlm-roberta-large-finetuned-conll03-english",
)