from openai import OpenAI

client = OpenAI(
    base_url="https://router.huggingface.co/v1",
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