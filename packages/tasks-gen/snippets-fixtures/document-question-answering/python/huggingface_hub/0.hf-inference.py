from huggingface_hub import InferenceClient, get_token

client = InferenceClient(
    provider="hf-inference",
    api_key=get_token(),
)

output = client.document_question_answering(
    "cat.png",
    question="What is in this image?",
    model="impira/layoutlm-invoices",
)