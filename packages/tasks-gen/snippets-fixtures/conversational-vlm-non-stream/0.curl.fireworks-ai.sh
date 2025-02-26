curl 'https://router.huggingface.co/fireworks-ai/v1/chat/completions' \
-H 'Authorization: Bearer api_token' \
-H 'Content-Type: application/json' \
--data '{
    "model": "<fireworks-ai alias for meta-llama/Llama-3.2-11B-Vision-Instruct>",
    "messages": [
		{
			"role": "user",
			"content": [
				{
					"type": "text",
					"text": "Describe this image in one sentence."
				},
				{
					"type": "image_url",
					"image_url": {
						"url": "https://cdn.britannica.com/61/93061-050-99147DCE/Statue-of-Liberty-Island-New-York-Bay.jpg"
					}
				}
			]
		}
	],
    "max_tokens": 500,
    "stream": false
}'