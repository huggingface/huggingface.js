from huggingface_hub import InferenceClient, get_token

client = InferenceClient(
    provider="fal-ai",
    api_key=get_token(),
)

with open("cat.png", "rb") as image_file:
   input_image = image_file.read()

video = client.image_to_video(
    input_image,
    prompt="The cat starts to dance",
    model="Wan-AI/Wan2.2-I2V-A14B",
)