from huggingface_hub import InferenceClient
client = InferenceClient("impira/layoutlm-invoices", token="api_token")

output = client.document_question_answering("cat.png", question="What is in this image?")