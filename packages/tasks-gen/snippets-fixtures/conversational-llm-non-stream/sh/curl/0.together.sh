curl https://router.huggingface.co/together/v1/chat/completions \
    -H "Authorization: Bearer $HF_TOKEN" \
    -H 'Content-Type: application/json' \
    -d '{
        "messages": [
            {
                "role": "user",
                "content": "What is the capital of France?"
            }
        ],
        "model": "<together alias for meta-llama/Llama-3.1-8B-Instruct>",
        "stream": false
    }'