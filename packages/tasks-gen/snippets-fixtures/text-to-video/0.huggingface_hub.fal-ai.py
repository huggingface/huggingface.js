from huggingface_hub import InferenceClient

client = InferenceClient(
    provider="fal-ai",
    api_key="api_token",
    model="tencent/HunyuanVideo",
)

video = client.text_to_video(
	"A young man walking on the street"
)