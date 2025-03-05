from huggingface_hub import InferenceClient

client = InferenceClient(
    provider="hf-inference",
    api_key="api_token",
    model="openai/whisper-large-v3-turbo",
)
output = client.automatic_speech_recognition("sample1.flac")