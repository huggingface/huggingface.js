import type { InferenceSnippet, ModelDataMinimal } from "./types";
import { describe, expect, it } from "vitest";
import { snippetConversational, getPythonInferenceSnippet } from "./python";

describe("inference API snippets", () => {
	it("conversational llm", async () => {
		const model: ModelDataMinimal = {
			id: "meta-llama/Llama-3.1-8B-Instruct",
			pipeline_tag: "text-generation",
			tags: ["conversational"],
			inference: "",
		};
		const snippet = snippetConversational(model, "api_token");

		expect(snippet[0].content).toEqual(`from huggingface_hub import InferenceClient

client = InferenceClient(api_key="api_token")

messages = [
	{
		"role": "user",
		"content": "What is the capital of France?"
	}
]

stream = client.chat.completions.create(
    model="meta-llama/Llama-3.1-8B-Instruct", 
	messages=messages, 
	max_tokens=500,
	stream=True
)

for chunk in stream:
    print(chunk.choices[0].delta.content, end="")`);
	});

	it("conversational vlm", async () => {
		const model: ModelDataMinimal = {
			id: "meta-llama/Llama-3.2-11B-Vision-Instruct",
			pipeline_tag: "image-text-to-text",
			tags: ["conversational"],
			inference: "",
		};
		const snippet = snippetConversational(model, "api_token");

		expect(snippet[0].content).toEqual(`from huggingface_hub import InferenceClient

client = InferenceClient(api_key="api_token")

messages = [
	{
		"role": "user",
		"content": [
			{
				"type": "text",
				"text": "Describe this image in one sentence."
			},
			{
				"type": "image_url",
				"image_url": {
					"url": "https://cdn.britannica.com/61/93061-050-99147DCE/Statue-of-Liberty-Island-New-York-Bay.jpg"
				}
			}
		]
	}
]

stream = client.chat.completions.create(
    model="meta-llama/Llama-3.2-11B-Vision-Instruct", 
	messages=messages, 
	max_tokens=500,
	stream=True
)

for chunk in stream:
    print(chunk.choices[0].delta.content, end="")`);
	});

	it("text-to-image", async () => {
		const model: ModelDataMinimal = {
			id: "black-forest-labs/FLUX.1-schnell",
			pipeline_tag: "text-to-image",
			tags: [],
			inference: "",
		};
		const snippets = getPythonInferenceSnippet(model, "api_token") as InferenceSnippet[];

		expect(snippets.length).toEqual(2);

		expect(snippets[0].client).toEqual("huggingface_hub");
		expect(snippets[0].content).toEqual(`from huggingface_hub import InferenceClient
client = InferenceClient("black-forest-labs/FLUX.1-schnell", token="api_token")
# output is a PIL.Image object
image = client.text_to_image("Astronaut riding a horse")`);

		expect(snippets[1].client).toEqual("requests");
		expect(snippets[1].content).toEqual(`import requests

API_URL = "https://api-inference.huggingface.co/models/black-forest-labs/FLUX.1-schnell"
headers = {"Authorization": "Bearer api_token"}

def query(payload):
	response = requests.post(API_URL, headers=headers, json=payload)
	return response.content
image_bytes = query({
	"inputs": "Astronaut riding a horse",
})
# You can access the image with PIL.Image for example
import io
from PIL import Image
image = Image.open(io.BytesIO(image_bytes))`);
	});
});
