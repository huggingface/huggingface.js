curl https://router.huggingface.co/hf-inference/models/openai/whisper-large-v3-turbo \
    -X POST \
    -H "Authorization: Bearer $HF_TOKEN" \
    -H 'Content-Type: audio/flac' \
    --data-binary @"sample1.flac"