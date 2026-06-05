curl https://router.huggingface.co/hf-inference/models/FacebookAI/xlm-roberta-large-finetuned-conll03-english \
    -X POST \
    -H "Authorization: Bearer $HF_TOKEN" \
    -H 'Content-Type: application/json' \
    -d '{
        "inputs": "\"My name is Sarah Jessica Parker but you can call me Jessica\""
    }'