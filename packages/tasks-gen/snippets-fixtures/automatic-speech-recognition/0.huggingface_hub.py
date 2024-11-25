from huggingface_hub import InferenceClient
client = InferenceClient("openai/whisper-large-v3-turbo", token="api_token")

output = client.automatic_speech_recognition("sample1.flac")