from huggingface_hub import InferenceClient, get_token

client = InferenceClient(
    api_key=get_token(),
)

completion = client.chat.completions.create(
    model="meta-llama/Llama-3.2-11B-Vision-Instruct:hf-inference",
    messages=[
        {
            "role": "user",
            "content": [
                {
                    "type": "text",
                    "text": "Describe this image in one sentence."
                },
                {
                    "type": "image_url",
                    "image_url": {
                        "url": "https://cdn.britannica.com/61/93061-050-99147DCE/Statue-of-Liberty-Island-New-York-Bay.jpg"
                    }
                }
            ]
        }
    ],
)

print(completion.choices[0].message)