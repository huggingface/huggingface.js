import fal_client
import base64

def on_queue_update(update):
    if isinstance(update, fal_client.InProgress):
        for log in update.logs:
           print(log["message"])

with open("cat.png", "rb") as image_file:
    image_base_64 = base64.b64encode(image_file.read()).decode('utf-8')

result = fal_client.subscribe(
    "<fal-ai alias for black-forest-labs/FLUX.1-Kontext-dev>",
    arguments={
        "image_url": f"data:image/png;base64,{image_base_64}",
        "prompt": "Turn the cat into a tiger.",
    },
    with_logs=True,
    on_queue_update=on_queue_update,
)
print(result)