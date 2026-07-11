from huggingface_hub import InferenceClient, get_token

client = InferenceClient(
    provider="replicate",
    api_key=get_token(),
)

video = client.text_to_video(
    "A young man walking on the street",
    model="tencent/HunyuanVideo",
)