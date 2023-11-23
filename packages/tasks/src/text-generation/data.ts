import type { TaskDataCustom } from "../Types";

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
			description: "A crowd-sourced instruction dataset to develop an AI assistant.",
			id: "OpenAssistant/oasst1",
		},
		{
			description: "A crowd-sourced instruction dataset created by Databricks employees.",
			id: "databricks/databricks-dolly-15k",
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
			description: "A model trained to follow instructions, uses Pythia-12b as base model.",
			id: "databricks/dolly-v2-12b",
		},
		{
			description: "A model trained to follow instructions curated by community, uses Pythia-12b as base model.",
			id: "OpenAssistant/oasst-sft-4-pythia-12b-epoch-3.5",
		},
		{
			description: "A large language model trained to generate text in English.",
			id: "stabilityai/stablelm-tuned-alpha-7b",
		},
		{
			description: "A model trained to follow instructions, based on mosaicml/mpt-7b.",
			id: "mosaicml/mpt-7b-instruct",
		},
		{
			description: "A large language model trained to generate text in English.",
			id: "EleutherAI/pythia-12b",
		},
		{
			description: "A large text-to-text model trained to follow instructions.",
			id: "google/flan-ul2",
		},
		{
			description: "A large and powerful text generation model.",
			id: "tiiuae/falcon-40b",
		},
		{
			description: "State-of-the-art open-source large language model.",
			id: "meta-llama/Llama-2-70b-hf",
		},
	],
	spaces: [
		{
			description: "A robust text generation model that can perform various tasks through natural language prompting.",
			id: "huggingface/bloom_demo",
		},
		{
			description: "An text generation based application that can write code for 80+ languages.",
			id: "bigcode/bigcode-playground",
		},
		{
			description: "An text generation based application for conversations.",
			id: "h2oai/h2ogpt-chatbot",
		},
		{
			description: "An text generation application that combines OpenAI and Hugging Face models.",
			id: "microsoft/HuggingGPT",
		},
		{
			description: "An text generation application that uses StableLM-tuned-alpha-7b.",
			id: "stabilityai/stablelm-tuned-alpha-chat",
		},
		{
			description: "An UI that uses StableLM-tuned-alpha-7b.",
			id: "togethercomputer/OpenChatKit",
		},
	],
	summary:
		"Generating text is the task of producing new text. These models can, for example, fill in incomplete text or paraphrase.",
	widgetModels: ["HuggingFaceH4/zephyr-7b-beta"],
	youtubeId: "Vpjb1lu0MDk",
};

export default taskData;
