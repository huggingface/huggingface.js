<script lang="ts">
	import type { ModelData } from "@huggingface/tasks";
	import { InferenceDisplayability } from "@huggingface/tasks";

	import InferenceWidget from "$lib/components/InferenceWidget/InferenceWidget.svelte";
	import ModeSwitcher from "$lib/components/DemoThemeSwitcher/DemoThemeSwitcher.svelte";
	import { onMount } from "svelte";
	import { browser } from "$app/environment";
	import { isLoggedIn } from "$lib/components/InferenceWidget/stores.js";

	export let data;
	let apiToken = data.session?.access_token || "";

	function storeHFToken() {
		window.localStorage.setItem("hf_token", apiToken);
	}

	/**
	 * If we are in an iframe, we need to open the auth page in a new tab
	 * to avoid issues with third-party cookies in a space
	 */
	const isIframe = browser && window.self !== window.parent;

	onMount(() => {
		if (!data.supportsOAuth) {
			const token = window.localStorage.getItem("hf_token");
			if (token) {
				apiToken = token;
			}
		}

		isLoggedIn.set(true);
	});

	const models: ModelData[] = [
		{
			id: "meta-llama/Meta-Llama-3-8B-Instruct",
			pipeline_tag: "text-generation",
			tags: ["conversational"],
			inference: InferenceDisplayability.Yes,
			config: {
				architectures: ["LlamaForCausalLM"],
				model_type: "llama",
				tokenizer_config: {
					chat_template:
						"{% set loop_messages = messages %}{% for message in loop_messages %}{% set content = '<|start_header_id|>' + message['role'] + '<|end_header_id|>\n\n'+ message['content'] | trim + '<|eot_id|>' %}{% if loop.index0 == 0 %}{% set content = bos_token + content %}{% endif %}{{ content }}{% endfor %}{% if add_generation_prompt %}{{ '<|start_header_id|>assistant<|end_header_id|>\n\n' }}{% endif %}",
					bos_token: "<|begin_of_text|>",
					eos_token: "<|end_of_text|>",
				},
			},
			widgetData: [
				{ text: "This is a text-only example", example_title: "Text only" },
				{
					messages: [{ content: "Please exlain QCD in very few words", role: "user" }],
					example_title: "Chat messages",
				},
				{
					messages: [{ content: "Please exlain QCD in very few words", role: "user" }],
					output: {
						text: "QCD is the physics of strong force and small particles.",
					},
					example_title: "Chat messages with Output",
				},
				{
					text: "Explain QCD in one short sentence.",
					output: {
						text: "QCD is the physics of strong force and small particles.",
					},
					example_title: "Text only with Output",
				},
				{
					example_title: "Invalid example - unsupported role",
					messages: [
						{ role: "system", content: "This will fail because of the chat template" },
						{ role: "user", content: "What's your favorite condiment?" },
					],
				},
			],
		},
		{
			id: "google/gemma-7b",
			pipeline_tag: "text-generation",
			inference: InferenceDisplayability.Yes,
		},
		{
			id: "microsoft/phi-2",
			pipeline_tag: "text-generation",
			inference: InferenceDisplayability.Yes,
			config: {
				architectures: ["PhiForCausalLM"],
				model_type: "phi",
				auto_map: {
					AutoConfig: "configuration_phi.PhiConfig",
					AutoModelForCausalLM: "modeling_phi.PhiForCausalLM",
				},
				tokenizer_config: {
					bos_token: "<|endoftext|>",
					eos_token: "<|endoftext|>",
					unk_token: "<|endoftext|>",
				},
			},
		},
		{
			id: "openai/clip-vit-base-patch16",
			pipeline_tag: "zero-shot-image-classification",
			inference: InferenceDisplayability.Yes,
		},
		{
			id: "lllyasviel/sd-controlnet-canny",
			pipeline_tag: "image-to-image",
			inference: InferenceDisplayability.Yes,
		},
		{
			id: "ydshieh/vit-gpt2-coco-en",
			pipeline_tag: "image-to-text",
			inference: InferenceDisplayability.Yes,
		},
		{
			id: "impira/layoutlm-document-qa",
			pipeline_tag: "document-question-answering",
			inference: InferenceDisplayability.Yes,
			widgetData: [
				{
					text: "What is the invoice number?",
					src: "https://huggingface.co/spaces/impira/docquery/resolve/2359223c1837a7587402bda0f2643382a6eefeab/invoice.png",
				},
				{
					text: "What is the purchase amount?",
					src: "https://huggingface.co/spaces/impira/docquery/resolve/2359223c1837a7587402bda0f2643382a6eefeab/contract.jpeg",
				},
			],
		},
		{
			id: "skops/hf_hub_example-bdc26c1f-7e82-42eb-9657-0318315f2df0",
			pipeline_tag: "tabular-classification",
			inference: InferenceDisplayability.Yes,
		},
		{
			id: "dandelin/vilt-b32-finetuned-vqa",
			pipeline_tag: "visual-question-answering",
			inference: InferenceDisplayability.Yes,
			widgetData: [
				{
					text: "What animal is it?",
					src: "https://huggingface.co/datasets/mishig/sample_images/resolve/main/tiger.jpg",
				},
				{
					text: "Where is it?",
					src: "https://huggingface.co/datasets/mishig/sample_images/resolve/main/palace.jpg",
				},
			],
		},
		{
			id: "roberta-large-mnli",
			pipeline_tag: "text-classification",
			inference: InferenceDisplayability.Yes,
			widgetData: [
				{
					text: "I like you. I love you.",
					group: "Contradiction",
					example_title: "Foobar",
					output: [
						{ label: "Hello", score: 0.8 },
						{ label: "Bye", score: 0.2 },
					],
				},
				{ text: "This is good. This is bad.", group: "Contradiction" },
				{ text: "He runs fast. He runs slow", group: "Contradiction" },
				{ text: "I like you", group: "Neutral" },
				{ text: "This is good", group: "Neutral" },
				{ text: "He runs fast", group: "Neutral" },
			],
		},
		{
			id: "edbeeching/decision-transformer-gym-hopper-medium-replay",
			pipeline_tag: "reinforcement-learning",
			inference: InferenceDisplayability.Yes,
		},
		{
			id: "sgugger/resnet50d",
			pipeline_tag: "image-classification",
			inference: InferenceDisplayability.Yes,
			widgetData: [
				{
					src: "https://huggingface.co/datasets/mishig/sample_images/resolve/main/tiger.jpg",
					example_title: "Tiger",
				},
				{
					src: "https://huggingface.co/datasets/mishig/sample_images/resolve/main/teapot.jpg",
					example_title: "Teapot",
					output: [
						{
							label: "teapot: pot for brewing tea; usually has a spout and handle",
							score: 0.8853782415390015,
						},
						{
							label: "coffeepot: tall pot in which coffee is brewed",
							score: 0.016733085736632347,
						},
						{
							label: "water jug: a jug that holds water",
							score: 0.0019129429711028934,
						},
						{
							label: "cup: a punch served in a pitcher instead of a punch bowl",
							score: 0.0009115593857131898,
						},
						{
							label: "strainer: a filter to retain larger pieces while smaller pieces and liquids pass through",
							score: 0.0007022042409516871,
						},
					],
				},
				{
					src: "https://huggingface.co/datasets/mishig/sample_images/resolve/main/palace.jpg",
					example_title: "Palace",
				},
			],
		},
		{
			id: "facebook/detr-resnet-50",
			pipeline_tag: "object-detection",
			inference: InferenceDisplayability.Yes,
		},
		{
			id: "facebook/detr-resnet-50-panoptic",
			pipeline_tag: "image-segmentation",
			inference: InferenceDisplayability.Yes,
		},
		{
			id: "julien-c/distilbert-feature-extraction",
			pipeline_tag: "feature-extraction",
			inference: InferenceDisplayability.Yes,
			widgetData: [{ text: "Hello world" }],
		},
		{
			id: "sentence-transformers/distilbert-base-nli-stsb-mean-tokens",
			pipeline_tag: "feature-extraction",
			inference: InferenceDisplayability.Yes,
			widgetData: [{ text: "Hello, world" }],
		},
		{
			id: "dbmdz/bert-large-cased-finetuned-conll03-english",
			pipeline_tag: "token-classification",
			inference: InferenceDisplayability.Yes,
			widgetData: [
				{ text: "My name is Wolfgang and I live in Berlin" },
				{ text: "My name is Sarah and I live in London" },
				{ text: "My name is Clara and I live in Berkeley, California." },
			],
		},
		{
			id: "distilbert-base-uncased-distilled-squad",
			pipeline_tag: "question-answering",
			inference: InferenceDisplayability.Yes,
			widgetData: [
				{
					text: "Which name is also used to describe the Amazon rainforest in English?",
					context: `The Amazon rainforest (Portuguese: Floresta Amazônica or Amazônia; Spanish: Selva Amazónica, Amazonía or usually Amazonia; French: Forêt amazonienne; Dutch: Amazoneregenwoud), also known in English as Amazonia or the Amazon Jungle, is a moist broadleaf forest that covers most of the Amazon basin of South America. This basin encompasses 7,000,000 square kilometres (2,700,000 sq mi), of which 5,500,000 square kilometres (2,100,000 sq mi) are covered by the rainforest. This region includes territory belonging to nine nations. The majority of the forest is contained within Brazil, with 60% of the rainforest, followed by Peru with 13%, Colombia with 10%, and with minor amounts in Venezuela, Ecuador, Bolivia, Guyana, Suriname and French Guiana. States or departments in four nations contain "Amazonas" in their names. The Amazon represents over half of the planet's remaining rainforests, and comprises the largest and most biodiverse tract of tropical rainforest in the world, with an estimated 390 billion individual trees divided into 16,000 species.`,
				},
			],
		},
		{
			id: "t5-base",
			pipeline_tag: "translation",
			inference: InferenceDisplayability.Yes,
			widgetData: [{ text: "My name is Wolfgang and I live in Berlin" }],
		},
		{
			id: "facebook/bart-large-cnn",
			pipeline_tag: "summarization",
			inference: InferenceDisplayability.Yes,
			widgetData: [
				{
					text: "The tower is 324 metres (1,063 ft) tall, about the same height as an 81-storey building, and the tallest structure in Paris. Its base is square, measuring 125 metres (410 ft) on each side. During its construction, the Eiffel Tower surpassed the Washington Monument to become the tallest man-made structure in the world, a title it held for 41 years until the Chrysler Building in New York City was finished in 1930. It was the first structure to reach a height of 300 metres. Due to the addition of a broadcasting aerial at the top of the tower in 1957, it is now taller than the Chrysler Building by 5.2 metres (17 ft). Excluding transmitters, the Eiffel Tower is the second tallest free-standing structure in France after the Millau Viaduct.",
				},
			],
		},
		{
			id: "mistralai/Mistral-7B-v0.1",
			pipeline_tag: "text-generation",
			inference: InferenceDisplayability.Yes,
			widgetData: [
				{ text: "My name is Julien and I like to", output: { text: " code cool products with my friends." } },
				{ text: "My name is Thomas and my main" },
				{ text: "My name is Mariama, my favorite" },
				{ text: "My name is Clara and I am" },
				{ text: "Once upon a time," },
			],
		},
		{
			id: "bigscience/bloom",
			pipeline_tag: "text-generation",
			inference: InferenceDisplayability.Yes,
			widgetData: [
				{ text: "My name is Julien and I like to", group: "English" },
				{ text: "My name is Thomas and my main", group: "English" },
				{ text: "My name is Mariama, my favorite", group: "French" },
				{ text: "My name is Clara and I am", group: "French" },
				{ text: "Once upon a time,", group: "French" },
			],
		},
		{
			id: "distilroberta-base",
			pipeline_tag: "fill-mask",
			mask_token: "<mask>",
			inference: InferenceDisplayability.Yes,
			widgetData: [{ text: "Paris is the <mask> of France." }, { text: "The goal of life is <mask>." }],
		},
		{
			id: "facebook/bart-large-mnli",
			pipeline_tag: "zero-shot-classification",
			inference: InferenceDisplayability.Yes,
			widgetData: [
				{
					text: "I have a problem with my iphone that needs to be resolved asap!!",
					candidate_labels: "urgent, not urgent, phone, tablet, computer",
					multi_class: true,
				},
			],
		},
		{
			id: "google/tapas-base-finetuned-wtq",
			pipeline_tag: "table-question-answering",
			inference: InferenceDisplayability.Yes,
			widgetData: [
				{
					text: "How many stars does the transformers repository have?",
					table: {
						Repository: ["Transformers", "Datasets", "Tokenizers"],
						Stars: [36542, 4512, 3934],
						Contributors: [651, 77, 34],
						"Programming language": ["Python", "Python", "Rust, Python and NodeJS"],
					},
				},
			],
		},
		{
			id: "microsoft/tapex-base-finetuned-wtq",
			pipeline_tag: "table-question-answering",
			inference: InferenceDisplayability.Yes,
			widgetData: [
				{
					text: "How many stars does the transformers repository have?",
					table: {
						Repository: ["Transformers", "Datasets", "Tokenizers"],
						Stars: [36542, 4512, 3934],
						Contributors: [651, 77, 34],
						"Programming language": ["Python", "Python", "Rust, Python and NodeJS"],
					},
				},
			],
		},
		{
			id: "julien-c/wine-quality",
			pipeline_tag: "tabular-classification",
			inference: InferenceDisplayability.Yes,
			widgetData: [
				{
					structured_data: {
						fixed_acidity: [7.4, 7.8, 10.3],
						volatile_acidity: [0.7, 0.88, 0.32],
						citric_acid: [0.0, 0.0, 0.45],
						residual_sugar: [1.9, 2.6, 6.4],
						chlorides: [0.076, 0.098, 0.073],
						free_sulfur_dioxide: [11.0, 25.0, 5.0],
						total_sulfur_dioxide: [34.0, 67.0, 13.0],
						density: [0.9978, 0.9968, 0.9976],
						pH: [3.51, 3.2, 3.23],
						sulphates: [0.56, 0.68, 0.82],
						alcohol: [9.4, 9.8, 12.6],
					},
				},
			],
		},
		{
			id: "bigscience/T0pp",
			pipeline_tag: "text2text-generation",
			inference: InferenceDisplayability.Yes,
		},
		{
			id: "facebook/blenderbot-400M-distill",
			pipeline_tag: "text2text-generation",
			inference: InferenceDisplayability.Yes,
			widgetData: [{ text: "Hey my name is Julien! How are you?" }],
		},
		{
			id: "osanseviero/BigGAN-deep-128",
			pipeline_tag: "text-to-image",
			inference: InferenceDisplayability.Yes,
			widgetData: [
				{
					text: "a tiger",
					output: {
						url: "https://huggingface.co/datasets/mishig/sample_images/resolve/main/tiger.jpg",
					},
				},
			],
		},
		{
			id: "julien-c/kan-bayashi_csmsc_tacotron2",
			pipeline_tag: "text-to-speech",
			inference: InferenceDisplayability.Yes,
			widgetData: [{ text: "请您说得慢些好吗" }],
		},
		{
			id: "superb/wav2vec2-base-superb-sid",
			pipeline_tag: "audio-classification",
			inference: InferenceDisplayability.Yes,
			widgetData: [
				{
					example_title: "Librispeech sample 1",
					src: "https://cdn-media.huggingface.co/speech_samples/sample1.flac",
					output: [
						{
							score: 1,
							label: "id10003",
						},
						{
							score: 3.958137817505758e-9,
							label: "id10912",
						},
						{
							score: 2.8285052078302897e-9,
							label: "id11089",
						},
						{
							score: 2.4077480009765395e-9,
							label: "id10017",
						},
						{
							score: 1.3356071804082603e-9,
							label: "id10045",
						},
					],
				},
			],
		},
		{
			id: "julien-c/mini_an4_asr_train_raw_bpe_valid",
			pipeline_tag: "automatic-speech-recognition",
			inference: InferenceDisplayability.Yes,
		},
		{
			id: "facebook/wav2vec2-base-960h",
			pipeline_tag: "automatic-speech-recognition",
			inference: InferenceDisplayability.Yes,
			widgetData: [
				{
					example_title: "Librispeech sample 1",
					src: "https://cdn-media.huggingface.co/speech_samples/sample1.flac",
					output: {
						text: "GOING ALONG SLUSHY COUNTRY ROADS AND SPEAKING TO DAMP AUDIENCES IN DRAUGHTY SCHOOL ROOMS DAY AFTER DAY FOR A FORTNIGHT HE'LL HAVE TO PUT IN AN APPEARANCE AT SOME PLACE OF WORSHIP ON SUNDAY MORNING AND HE CAN COME TO US IMMEDIATELY AFTERWARDS",
					},
				},
			],
		},
		{
			id: "facebook/wav2vec2-large-xlsr-53-french",
			pipeline_tag: "automatic-speech-recognition",
			inference: InferenceDisplayability.Yes,
			widgetData: [
				{
					example_title: "Librispeech sample 1",
					src: "https://cdn-media.huggingface.co/speech_samples/sample1.flac",
				},
			],
		},
		{
			id: "manandey/wav2vec2-large-xlsr-mongolian",
			pipeline_tag: "automatic-speech-recognition",
			inference: InferenceDisplayability.Yes,
			widgetData: [
				{
					example_title: "Librispeech sample 1",
					src: "https://cdn-media.huggingface.co/speech_samples/sample1.flac",
				},
			],
		},
		{
			id: "osanseviero/full-sentence-distillroberta2",
			pipeline_tag: "sentence-similarity",
			inference: InferenceDisplayability.Yes,
			widgetData: [
				{
					source_sentence: "That is a happy person",
					sentences: ["That is a happy dog", "That is a very happy person", "Today is a sunny day"],
				},
			],
		},
		{
			id: "speechbrain/mtl-mimic-voicebank",
			private: false,
			pipeline_tag: "audio-to-audio",
			inference: InferenceDisplayability.Yes,
			tags: ["speech-enhancement"],
			widgetData: [],
		},
		{
			id: "speechbrain/sepformer-wham",
			private: false,
			pipeline_tag: "audio-to-audio",
			inference: InferenceDisplayability.Yes,
			tags: ["audio-source-separation"],
			widgetData: [],
		},
		{
			id: "julien-c/DPRNNTasNet-ks16_WHAM_sepclean",
			private: false,
			pipeline_tag: "audio-to-audio",
			inference: InferenceDisplayability.Yes,
			tags: ["audio-source-separation"],
			widgetData: [],
		},
	];

	const modelsDisabled: ModelData[] = [
		{
			id: "gpt2",
			pipeline_tag: undefined,
			inference: InferenceDisplayability.PipelineNotDetected,
		},
		{
			id: "gpt2",
			pipeline_tag: "text-generation",
			inference: InferenceDisplayability.ExplicitOptOut,
		},
		{
			id: "gpt2",
			pipeline_tag: "text-generation",
			inference: InferenceDisplayability.LibraryNotDetected,
		},
		{
			id: "gpt2",
			pipeline_tag: "text-generation",
			inference: InferenceDisplayability.PipelineLibraryPairNotSupported,
		},
		{
			id: "gpt2",
			pipeline_tag: "text-generation",
			inference: InferenceDisplayability.PipelineNotDetected,
		},
		{
			id: "Phind/Phind-CodeLlama-34B-v1",
			pipeline_tag: "text-generation",
			inference: InferenceDisplayability.Yes,
		},
	];

	const modelsDisabledWithExamples: ModelData[] = [
		{
			id: "superb/wav2vec2-base-superb-sid",
			pipeline_tag: "audio-classification",
			inference: InferenceDisplayability.CustomCode,
			widgetData: [
				{
					example_title: "Librispeech sample 1",
					src: "https://cdn-media.huggingface.co/speech_samples/sample1.flac",
					output: [
						{
							score: 1,
							label: "id10003",
						},
						{
							score: 3.958137817505758e-9,
							label: "id10912",
						},
					],
				},
			],
		},
		{
			id: "osanseviero/BigGAN-deep-128",
			pipeline_tag: "text-to-image",
			inference: InferenceDisplayability.LibraryNotDetected,
			widgetData: [
				{
					text: "a tiger",
					output: {
						url: "https://huggingface.co/datasets/mishig/sample_images/resolve/main/tiger.jpg",
					},
				},
			],
		},
		{
			id: "gpt2",
			pipeline_tag: "text-generation",
			inference: InferenceDisplayability.PipelineNotDetected,
			widgetData: [
				// the widget should only show sample with output here
				{ text: "My name is Julien and I like to", output: { text: "code cool products with my friends." } },
				{ text: "My name is Thomas and my main" },
				{ text: "My name is Mariama, my favorite" },
				{ text: "My name is Clara and I am" },
				{ text: "Once upon a time," },
			],
		},
	];
</script>

<div class="flex flex-col gap-6 py-12 px-4">
	<ModeSwitcher />

	{#if data.supportsOAuth}
		{#if !data.session}
			<form class="contents" method="post" action="/auth/signin/huggingface" target={isIframe ? "_blank" : ""}>
				<button type="submit" title="Sign in with Hugging Face">
					<img
						src="https://huggingface.co/datasets/huggingface/badges/resolve/main/sign-in-with-huggingface-xl-dark.svg"
						alt="Sign in with Hugging Face"
						class="h-12 w-auto"
					/>
				</button>
			</form>
		{:else}
			<div class="flex items-center gap-2">
				logged in as {data.session.user?.username}
				<img src={data.session?.user?.image} alt="" class="w-6 h-6 rounded-full" />
				<form method="post" action="/auth/signout">
					<button type="submit" class="underline">Sign out</button>
				</form>
			</div>
		{/if}
	{:else}
		<label>
			<div class="text-xl font-semibold">First, Enter HF token</div>
			<input class="form-input" type="text" bind:value={apiToken} placeholder="hf_..." on:change={storeHFToken} />
		</label>
	{/if}
	<label>
		<div class="text-xl font-semibold">
			isLoggedIn <span class="text-sm">(simulate isLoggedIn store by toggling)</span>
		</div>
		<input type="checkbox" bind:checked={$isLoggedIn} />
	</label>

	<div>
		<h1 class="mb-8 text-4xl font-semibold">Showcase of all types of inference widgets running</h1>
		<div class="grid gap-4 w-full" style="grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));">
			{#each models as model}
				<div>
					<a class="mb-3 block text-xs text-gray-300" href="/{model.id}">
						<code>{model.id}</code>
					</a>
					<div class="rounded-xl bg-white p-5 shadow-sm">
						<InferenceWidget {apiToken} {model} />
					</div>
				</div>
			{/each}
		</div>
	</div>

	<div>
		<h1 class="mb-8 text-4xl font-semibold">Showcase of all types of disabled inference</h1>
		<div class="grid gap-4 w-full" style="grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));">
			{#each modelsDisabled as model}
				<div>
					<a class="mb-3 block text-xs text-gray-300" href="/{model.id}">
						<code>{model.id}</code>
					</a>
					<div class="max-w-md rounded-xl bg-white p-5 shadow-sm">
						<InferenceWidget {apiToken} {model} />
					</div>
				</div>
			{/each}
		</div>
	</div>

	<div>
		<h1 class="mb-8 text-4xl font-semibold">Showcase of all types of disabled inference with example outputs</h1>
		<div class="grid gap-4 w-full" style="grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));">
			{#each modelsDisabledWithExamples as model}
				<div>
					<a class="mb-3 block text-xs text-gray-300" href="/{model.id}">
						<code>{model.id}</code>
					</a>
					<div class="max-w-md rounded-xl bg-white p-5 shadow-sm">
						<InferenceWidget {apiToken} {model} />
					</div>
				</div>
			{/each}
		</div>
	</div>
</div>
