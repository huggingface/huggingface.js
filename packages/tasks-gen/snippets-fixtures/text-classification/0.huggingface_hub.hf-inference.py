from huggingface_hub import InferenceClient

client = InferenceClient(
    provider="hf-inference",
    api_key="api_token",
    model="distilbert/distilbert-base-uncased-finetuned-sst-2-english",
)

result = client.text_classification(
	inputs="I like you. I love you",
	provider="hf-inference",
)

print(result)
