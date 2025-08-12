import { chatCompletionStream } from "@huggingface/inference";

async function main() {
	const endpointUrl = `http://localhost:9999/v1/chat/completions`;
	// launch "tiny-agents serve" before running this

	for await (const chunk of chatCompletionStream({
		endpointUrl,
		model: "",
		messages: [{ role: "user", content: "What are the top 5 trending models on Hugging Face?" }],
	})) {
		console.log(chunk.choices[0]?.delta.content);
	}
}

if (require.main === module) {
	main();
}
