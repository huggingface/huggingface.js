curl https://router.huggingface.co/hf-inference/models/openai/whisper-large-v3-turbo \
    -X POST \
    -H 'Authorization: Bearer api_token' \
    -H 'Content-Type: audio/flac' \
    --data-binary @"sample1.flac"