from huggingface_hub import InferenceClient

client = InferenceClient(
	provider="hf-inference",
	api_key="api_token"
)

messages = [
	{
		"role": "user",
		"content": "What is the capital of France?"
	}
]

stream = client.chat.completions.create(
	model="meta-llama/Llama-3.1-8B-Instruct", 
	messages=messages, 
	max_tokens=500,
	stream=True
)

for chunk in stream:
    print(chunk.choices[0].delta.content, end="")