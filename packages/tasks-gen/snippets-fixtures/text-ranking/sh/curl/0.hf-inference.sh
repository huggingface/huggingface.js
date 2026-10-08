curl https://router.huggingface.co/hf-inference/models/cross-encoder/ettin-reranker-68m-v1 \
    -X POST \
    -H "Authorization: Bearer $HF_TOKEN" \
    -H 'Content-Type: application/json' \
    -d '{
        "inputs": "{\n    \"query\": \"Which planet is known as the Red Planet?\",\n    \"texts\": [\n        \"Venus is often called Earth's twin because of its similar size and proximity.\",\n        \"Mars, known for its reddish appearance, is often referred to as the Red Planet.\",\n        \"Jupiter, the largest planet in our solar system, has a prominent red spot.\",\n        \"Saturn, famous for its rings, is sometimes mistaken for the Red Planet.\"\n    ]\n}"
    }'