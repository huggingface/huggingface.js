from openai import OpenAI

client = OpenAI(
    base_url="https://router.huggingface.co/together",
    api_key="api_token"
)

messages = [
	{
		"role": "user",
		"content": "What is the capital of France?"
	}
]

stream = client.chat.completions.create(
    model="<together alias for meta-llama/Llama-3.1-8B-Instruct>",
    messages=messages,
    max_tokens=500,
    stream=True
)

for chunk in stream:
    print(chunk.choices[0].delta.content, end="")