from huggingface_hub import InferenceClient

client = InferenceClient(
    provider="hf-inference",
    api_key="api_token",
)

completion = client.chat.completions.create(
    model="meta-llama/Llama-3.1-8B-Instruct",
    messages=[
        {
            "role": "user",
            "content": "What is the capital of France?"
        }
    ],
    max_tokens=512,
)

print(completion.choices[0].message)