from huggingface_hub import InferenceClient, get_token

client = InferenceClient(
    provider="hf-inference",
    api_key=get_token(),
)

result = client.text_classification(
    "I like you. I love you",
    model="distilbert/distilbert-base-uncased-finetuned-sst-2-english",
)