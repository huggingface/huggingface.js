import type { TaskDataCustom } from "..";

const taskData: TaskDataCustom = {
	datasets: [
		{
			description: "A large multilingual dataset of text crawled from the web.",
			id: "mc4",
		},
		{
			description:
				"Diverse open-source data consisting of 22 smaller high-quality datasets. It was used to train GPT-Neo.",
			id: "the_pile",
		},
		{
			description: "Truly open-source, curated and cleaned dialogue dataset.",
			id: "HuggingFaceH4/ultrachat_200k",
		},
		{
			description: "An instruction dataset with preference ratings on responses.",
			id: "openbmb/UltraFeedback",
		},
	],
	demo: {
		inputs: [
			{
				label: "Input",
				content: "Once upon a time,",
				type: "text",
			},
		],
		outputs: [
			{
				label: "Output",
				content:
					"Once upon a time, we knew that our ancestors were on the verge of extinction. The great explorers and poets of the Old World, from Alexander the Great to Chaucer, are dead and gone. A good many of our ancient explorers and poets have",
				type: "text",
			},
		],
	},
	metrics: [
		{
			description:
				"Cross Entropy is a metric that calculates the difference between two probability distributions. Each probability distribution is the distribution of predicted words",
			id: "Cross Entropy",
		},
		{
			description:
				"The Perplexity metric is the exponential of the cross-entropy loss. It evaluates the probabilities assigned to the next word by the model. Lower perplexity indicates better performance",
			id: "Perplexity",
		},
	],
	models: [
		{
			description: "A large language model trained for text generation.",
			id: "bigscience/bloom-560m",
		},
		{
			description: "A large code generation model that can generate code in 80+ languages.",
			id: "bigcode/starcoder",
		},
		{
			description: "A very powerful text generation model.",
			id: "mistralai/Mixtral-8x7B-Instruct-v0.1",
		},
		{
			description: "Small yet powerful text generation model.",
			id: "microsoft/phi-2",
		},
		{
			description: "A very powerful model that can chat, do mathematical reasoning and write code.",
			id: "openchat/openchat-3.5-0106",
		},
		{
			description: "Very strong yet small assistant model.",
			id: "HuggingFaceH4/zephyr-7b-beta",
		},
		{
			description: "Very strong open-source large language model.",
			id: "meta-llama/Llama-2-70b-hf",
		},
	],
	spaces: [
		{
			description: "A leaderboard to compare different open-source text generation models based on various benchmarks.",
			id: "open-llm-leaderboard/open_llm_leaderboard",
		},
		{
			description: "An text generation based application based on a very powerful LLaMA2 model.",
			id: "ysharma/Explore_llamav2_with_TGI",
		},
		{
			description: "An text generation based application to converse with Zephyr model.",
			id: "HuggingFaceH4/zephyr-chat",
		},
		{
			description: "An text generation application that combines OpenAI and Hugging Face models.",
			id: "microsoft/HuggingGPT",
		},
		{
			description: "An chatbot to converse with a very powerful text generation model.",
			id: "mlabonne/phixtral-chat",
		},
	],
	summary:
		"Generating text is the task of generating new text given another text. These models can, for example, fill in incomplete text or paraphrase.",
	widgetModels: ["HuggingFaceH4/zephyr-7b-beta"],
	youtubeId: "Vpjb1lu0MDk",
};

export default taskData;
