curl https://router.huggingface.co/hf-inference/models/facebook/bart-large-mnli \
    -X POST \
    -d '{"inputs": "Hi, I recently bought a device from your company but it is not working as advertised and I would like to get reimbursed!", "parameters": {"candidate_labels": ["refund", "legal", "faq"]}}' \
    -H 'Content-Type: application/json' \
    -H 'Authorization: Bearer api_token'