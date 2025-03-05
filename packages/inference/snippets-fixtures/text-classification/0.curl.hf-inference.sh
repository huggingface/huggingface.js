curl https://router.huggingface.co/hf-inference/models/distilbert/distilbert-base-uncased-finetuned-sst-2-english \
	-X POST \
	-d '{"inputs": "I like you. I love you"}' \
	-H 'Content-Type: application/json' \
	-H 'Authorization: Bearer api_token'