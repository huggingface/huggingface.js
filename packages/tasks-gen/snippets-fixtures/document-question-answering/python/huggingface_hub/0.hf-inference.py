import os
from huggingface_hub import InferenceClient

client = InferenceClient(
    provider="hf-inference",
    api_key=os.getenv("HF_TOKEN"),
)

output = client.document_question_answering(
    "cat.png",
    question="What is in this image?",
    model="impira/layoutlm-invoices",
)