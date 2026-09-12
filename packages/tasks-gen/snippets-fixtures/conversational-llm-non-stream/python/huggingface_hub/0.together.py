from huggingface_hub import InferenceClient, get_token

client = InferenceClient(
    api_key=get_token(),
)

completion = client.chat.completions.create(
    model="meta-llama/Llama-3.1-8B-Instruct:together",
    messages=[
        {
            "role": "user",
            "content": "What is the capital of France?"
        }
    ],
)

print(completion.choices[0].message)