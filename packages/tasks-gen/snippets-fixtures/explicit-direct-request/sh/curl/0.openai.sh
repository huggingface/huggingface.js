curl https://api.openai.com/v1/chat/completions \
    -H "Authorization: Bearer $OPENAI_API_KEY" \
    -H 'Content-Type: application/json' \
    -d '{
        "model": "<openai alias for meta-llama/Llama-3.1-8B-Instruct>",
        "messages": [
            {
                "role": "user",
                "content": "What is the capital of France?"
            }
        ],
        "stream": false
    }'