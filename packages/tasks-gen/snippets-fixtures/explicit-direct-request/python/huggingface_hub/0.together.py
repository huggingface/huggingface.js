import os
from huggingface_hub import InferenceClient

client = InferenceClient(
    provider="together",
    api_key=os.environ["TOGETHER_API_KEY"],
)

completion = client.chat.completions.create(
    model="<together alias for meta-llama/Llama-3.1-8B-Instruct>",
    messages=[
        {
            "role": "user",
            "content": "What is the capital of France?"
        }
    ],
)

print(completion.choices[0].message)