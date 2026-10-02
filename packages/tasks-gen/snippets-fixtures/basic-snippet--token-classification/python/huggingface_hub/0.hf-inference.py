from huggingface_hub import InferenceClient, get_token

client = InferenceClient(
    provider="hf-inference",
    api_key=get_token(),
)

result = client.token_classification(
    "My name is Sarah Jessica Parker but you can call me Jessica",
    model="FacebookAI/xlm-roberta-large-finetuned-conll03-english",
)