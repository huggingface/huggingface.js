import fal_client

result = fal_client.subscribe(
    "<fal-ai alias for openfree/flux-chatgpt-ghibli-lora>",
    arguments={
        "prompt": "Astronaut riding a horse",
    },
)
print(result)