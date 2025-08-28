import fal_client
import base64

def on_queue_update(update):
    if isinstance(update, fal_client.InProgress):
        for log in update.logs:
           print(log["message"])

with open("cat.png", "rb") as image_file:
    image_base_64 = base64.b64encode(image_file.read()).decode('utf-8')

result = fal_client.subscribe(
    "Wan-AI/Wan2.2-I2V-A14B",
    arguments={
        "image_url": f"data:image/png;base64,{image_base_64}",
        "prompt": "The cat starts to dance",
    },
    with_logs=True,
    on_queue_update=on_queue_update,
)
print(result)