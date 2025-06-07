curl https://router.huggingface.co/hf-inference/models/Falconsai/nsfw_image_detection \
    -X POST \
    -H "Authorization: Bearer $HF_TOKEN" \
    -H 'Content-Type: image/jpeg' \
    --data-binary @"cats.jpg"