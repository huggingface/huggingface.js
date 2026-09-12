from huggingface_hub import InferenceClient, get_token

client = InferenceClient(
    provider="hf-inference",
    api_key=get_token(),
)

output = client.automatic_speech_recognition("sample1.flac", model="openai/whisper-large-v3-turbo")