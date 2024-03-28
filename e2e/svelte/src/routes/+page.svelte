<script>
	import { whoAmI, listFiles } from "@huggingface/hub";
	import { HfInference } from "@huggingface/inference";

	const hf = new HfInference();

	const test = async () => {
		const info = await whoAmI({ credentials: { accessToken: "hf_hub.js" }, hubUrl: "https://hub-ci.huggingface.co" });
		console.log(info);

		for await (const file of listFiles({ credentials: { accessToken: "hf_hub.js" }, repo: "gpt2" })) {
			console.log(file);
		}

		const sum = await hf.summarization({
			model: "google/pegasus-xsum",
			inputs:
				"The tower is 324 metres (1,063 ft) tall, about the same height as an 81-storey building, and the tallest structure in Paris. Its base is square, measuring 125 metres (410 ft) on each side. During its construction, the Eiffel Tower surpassed the Washington Monument to become the tallest man-made structure in the world, a title it held for 41 years until the Chrysler Building in New York City was finished in 1930.",
			parameters: {
				max_length: 100,
			},
		});

		console.log(sum);
	};

	test();
</script>

<h1>Welcome to SvelteKit</h1>
<p>Visit <a href="https://kit.svelte.dev">kit.svelte.dev</a> to read the documentation</p>
