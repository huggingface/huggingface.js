<script>
	import { whoAmI, listFiles } from "@huggingface/hub";
	import { InferenceClient } from "@huggingface/inference";

	const hf = new InferenceClient();

	const test = async () => {
		const info = await whoAmI({ credentials: { accessToken: "hf_hub.js" }, hubUrl: "https://hub-ci.huggingface.co" });
		console.log(info);

		for await (const file of listFiles({ credentials: { accessToken: "hf_hub.js" }, repo: "gpt2" })) {
			console.log(file);
		}

		const result = await hf.chatCompletion({
			model: "microsoft/Phi-3-mini-4k-instruct",
			messages: [{ role: "user", content: "How high is the Eiffel Tower?" }],
			max_tokens: 10,
		});

		console.log(result);
	};

	test();
</script>

<h1>Welcome to SvelteKit</h1>
<p>Visit <a href="https://kit.svelte.dev">kit.svelte.dev</a> to read the documentation</p>
