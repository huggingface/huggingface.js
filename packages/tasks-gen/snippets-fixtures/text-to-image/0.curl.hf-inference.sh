curl https://api-inference.huggingface.co/models/black-forest-labs/FLUX.1-schnell \
	-X POST \
	-d '{"inputs": "Astronaut riding a horse"}' \
	-H 'Content-Type: application/json' \
	-H 'Authorization: Bearer api_token'