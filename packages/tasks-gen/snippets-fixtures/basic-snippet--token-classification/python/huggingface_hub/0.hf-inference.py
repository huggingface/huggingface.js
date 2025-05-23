from huggingface_hub import InferenceClient

client = InferenceClient(
    provider="hf-inference",
    api_key="api_token",
)

result = client.token_classification(
    "My name is Sarah Jessica Parker but you can call me Jessica",
    model="FacebookAI/xlm-roberta-large-finetuned-conll03-english",
)