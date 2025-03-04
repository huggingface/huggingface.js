from huggingface_hub import InferenceClient

client = InferenceClient(
	provider="replicate",
	api_key="api_token"
)

video = client.text_to_video(
	"A young man walking on the street",
	model="tencent/HunyuanVideo"
)