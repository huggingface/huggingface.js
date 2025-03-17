curl https://router.huggingface.co/hf-inference/models/distilbert/distilbert-base-uncased-finetuned-sst-2-english \
    -X POST \
    -H 'Authorization: Bearer api_token' \
    -H 'Content-Type: application/json' \
    -d '{
        "inputs": "\"I like you. I love you\""
    }'