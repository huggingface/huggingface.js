import { InferenceClient } from "@huggingface/inference";
import { whoAmI } from "@huggingface/hub";

const hfToken = process.env.token;

const hf = new InferenceClient(hfToken);

(async () => {
	const info = await whoAmI({ credentials: { accessToken: "hf_hub.js" }, hubUrl: "https://hub-ci.huggingface.co" });
	console.log(info);

	if (hfToken) {
		const result = await hf.chatCompletion({
			model: "meta-llama/Llama-3.2-1B-Instruct",
			messages: [{ role: "user", content: "Can you summarize the Eiffel Tower?" }],
			parameters: {
				max_length: 100,
			},
		});

		console.log(result);
	}
})();
