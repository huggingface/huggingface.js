import { InferenceClient } from "npm:@huggingface/inference@*";
import { whoAmI, listFiles } from "npm:@huggingface/hub@*";

const info = await whoAmI({ credentials: { accessToken: "hf_hub.js" }, hubUrl: "https://hub-ci.huggingface.co" });
console.log(info);

for await (const file of listFiles({ repo: "gpt2" })) {
	console.log(file);
}

const token = Deno.env.get("HF_TOKEN");
if (token) {
	const hf = new InferenceClient(token);

	const tokenInfo = await whoAmI({ credentials: { accessToken: token } });
	console.log(tokenInfo);

	const result = await hf.chatCompletion({
		model: "meta-llama/Llama-3.2-1B-Instruct",
		messages: [{ role: "user", content: "Can you summarize the Eiffel Tower?" }],
		max_tokens: 10,
	});

	console.log(result);
}
