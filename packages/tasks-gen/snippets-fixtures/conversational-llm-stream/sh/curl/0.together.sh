curl https://api.together.xyz/v1/chat/completions \
    -H 'Authorization: Bearer api_token' \
    -H 'Content-Type: application/json' \
    -d '{
        "messages": [
            {
                "role": "user",
                "content": "What is the capital of France?"
            }
        ],
        "max_tokens": 500,
        "model": "<together alias for meta-llama/Llama-3.1-8B-Instruct>",
        "stream": true
    }'