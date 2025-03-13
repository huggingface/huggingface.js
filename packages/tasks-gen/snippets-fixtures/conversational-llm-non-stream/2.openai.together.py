from openai import OpenAI

client = OpenAI(
    base_url="https://api.together.xyz/v1",
    api_key="api_token"
)

completion = client.chat.completions.create(
    model="<together alias for meta-llama/Llama-3.1-8B-Instruct>",
    messages=[
        {
            "role": "user",
            "content": "What is the capital of France?"
        }
    ],
    max_tokens=500,
)

print(completion.choices[0].message)