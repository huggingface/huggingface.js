curl http://localhost:8080/v1/chat/completions \
    -H "Authorization: Bearer $API_TOKEN" \
    -H 'Content-Type: application/json' \
    -d '{
        "messages": [
            {
                "role": "user",
                "content": "What is the capital of France?"
            }
        ],
        "model": "meta-llama/Llama-3.1-8B-Instruct",
        "stream": false
    }'