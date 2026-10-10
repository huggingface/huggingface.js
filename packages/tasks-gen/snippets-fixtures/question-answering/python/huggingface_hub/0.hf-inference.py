from huggingface_hub import InferenceClient, get_token

client = InferenceClient(
    provider="hf-inference",
    api_key=get_token(),
)

answer = client.question_answering(
    question="What is my name?",
    context="My name is Clara and I live in Berkeley.",
    model="google-bert/bert-large-uncased-whole-word-masking-finetuned-squad",
)