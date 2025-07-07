import os
from openai import OpenAI

client = OpenAI(
    base_url="https://router.huggingface.co/hf-inference/models/meta-llama/Llama-3.1-8B-Instruct/v1",
    api_key=os.environ["HF_TOKEN"],
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