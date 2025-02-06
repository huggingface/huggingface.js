from huggingface_hub import InferenceClient

client = InferenceClient(
	provider="together",
	api_key="api_token"
)

messages = [
	{
		"role": "user",
		"content": "What is the capital of France?"
	}
]

completion = client.chat.completions.create(
    model="meta-llama/Llama-3.1-8B-Instruct", 
	messages=messages, 
	max_tokens=500
)

print(completion.choices[0].message)