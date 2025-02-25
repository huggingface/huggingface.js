curl 'https://router.huggingface.co/together/v1/chat/completions' \
-H 'Authorization: Bearer api_token' \
-H 'Content-Type: application/json' \
--data '{
    "model": "<together alias for meta-llama/Llama-3.1-8B-Instruct>",
    "messages": [
		{
			"role": "user",
			"content": "What is the capital of France?"
		}
	],
    "max_tokens": 500,
    "stream": false
}'