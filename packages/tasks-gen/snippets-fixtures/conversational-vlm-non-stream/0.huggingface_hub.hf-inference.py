from huggingface_hub import InferenceClient

client = InferenceClient(
	provider="hf-inference",
	api_key="api_token"
)

messages = [
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
]

completion = client.chat.completions.create(
    model="meta-llama/Llama-3.2-11B-Vision-Instruct", 
	messages=messages, 
	max_tokens=500
)

print(completion.choices[0].message)