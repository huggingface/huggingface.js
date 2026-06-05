from huggingface_hub import InferenceClient

client = InferenceClient(
    api_key="hf_xxx",
)

completion = client.chat.completions.create(
    model="meta-llama/Llama-3.1-8B-Instruct:hf-inference",
    messages=[
        {
            "role": "user",
            "content": "What is the capital of France?"
        }
    ],
)

print(completion.choices[0].message)