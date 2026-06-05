import { InferenceClient } from "@huggingface/inference";
import { whoAmI } from "@huggingface/hub";

const hfToken = process.env.token;

const hf = new InferenceClient(hfToken);

(async () => {
	const info = await whoAmI({ credentials: { accessToken: "hf_hub.js" }, hubUrl: "https://hub-ci.huggingface.co" });
	console.log(info);

	if (hfToken) {
		const result = await hf.chatCompletion({
			model: "Qwen/Qwen2.5-7B-Instruct",
			messages: [{ role: "user", content: "Can you summarize the Eiffel Tower?" }],
			max_tokens: 10,
		});

		console.log(result);
	}
})();
