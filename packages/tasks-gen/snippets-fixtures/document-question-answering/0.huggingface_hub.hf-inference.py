from huggingface_hub import InferenceClient

client = InferenceClient(
    provider="hf-inference",
    api_key="api_token",
    model="impira/layoutlm-invoices",
)
output = client.document_question_answering(
    "cat.png",
	question="What is in this image?",
)