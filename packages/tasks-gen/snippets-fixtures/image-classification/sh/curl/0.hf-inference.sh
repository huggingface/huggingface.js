curl https://router.huggingface.co/hf-inference/models/Falconsai/nsfw_image_detection \
    -X POST \
    -H 'Authorization: Bearer api_token' \
    -H 'Content-Type: image/jpeg' \
    --data-binary @"cats.jpg"