import os
from huggingface_hub import InferenceClient

client = InferenceClient(
    base_url="http://localhost:8080/v1",
    provider="hf-inference",
    api_key=os.environ["API_TOKEN"],
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