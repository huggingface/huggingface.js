import os
from huggingface_hub import InferenceClient

client = InferenceClient(
    provider="openai",
    api_key=os.environ["OPENAI_API_KEY"],
)

completion = client.chat.completions.create(
    model="meta-llama/Llama-3.1-8B-Instruct",
    messages=[
        {
            "role": "user",
            "content": "What is the capital of France?"
        }
    ],
)

print(completion.choices[0].message)