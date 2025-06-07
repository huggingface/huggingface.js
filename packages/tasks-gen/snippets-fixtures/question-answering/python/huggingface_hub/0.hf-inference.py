import os
from huggingface_hub import InferenceClient

client = InferenceClient(
    provider="hf-inference",
    api_key=os.environ["HF_TOKEN"],
)

answer = client.question_answering(
    question="What is my name?",
    context="My name is Clara and I live in Berkeley.",
    model="google-bert/bert-large-uncased-whole-word-masking-finetuned-squad",
)