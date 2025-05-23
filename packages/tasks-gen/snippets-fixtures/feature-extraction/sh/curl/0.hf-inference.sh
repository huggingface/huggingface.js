curl https://router.huggingface.co/hf-inference/models/intfloat/multilingual-e5-large-instruct/pipeline/feature-extraction \
    -X POST \
    -H 'Authorization: Bearer api_token' \
    -H 'Content-Type: application/json' \
    -d '{
        "inputs": "\"Today is a sunny day and I will get some ice cream.\""
    }'