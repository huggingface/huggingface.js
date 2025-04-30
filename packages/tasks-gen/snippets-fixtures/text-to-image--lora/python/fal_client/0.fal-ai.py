import fal_client

result = fal_client.subscribe(
    "<fal-ai alias for openfree/flux-chatgpt-ghibli-lora>",
    arguments={
        "prompt": "Astronaut riding a horse",
        "loras":[{"path": "https://huggingface.co/openfree/flux-chatgpt-ghibli-lora/resolve/main/<path to LoRA weights in .safetensors format>", "scale": 1}],
    },
)
 
print(result)