import type { TaskDataCustom } from "../index.js";

const taskData: TaskDataCustom = {
	datasets: [
		{
			description: "Multilingual dataset used to evaluate text generation models.",
			id: "CohereForAI/Global-MMLU",
		},
		{
			description: "High quality multilingual data used to train text-generation models.",
			id: "HuggingFaceFW/fineweb-2",
		},
		{
			description: "Truly open-source, curated and cleaned dialogue dataset.",
			id: "HuggingFaceH4/ultrachat_200k",
		},
		{
			description: "A multilingual instruction dataset with preference ratings on responses.",
			id: "allenai/tulu-3-sft-mixture",
		},
		{
			description: "A large synthetic dataset for alignment of text generation models.",
			id: "HuggingFaceTB/smoltalk",
		},
		{
			description: "A dataset made for training text generation models solving math questions.",
			id: "HuggingFaceTB/finemath",
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
			description: "A text-generation model trained to follow instructions.",
			id: "google/gemma-2-2b-it",
		},
		{
			description: "Very powerful text generation model trained to follow instructions.",
			id: "meta-llama/Meta-Llama-3.1-8B-Instruct",
		},
		{
			description: "Powerful text generation model by Microsoft.",
			id: "microsoft/phi-4",
		},
		{
			description: "A very powerful model with reasoning capabilities.",
			id: "PowerInfer/SmallThinker-3B-Preview",
		},
		{
			description: "Strong text generation model to follow instructions.",
			id: "Qwen/Qwen2.5-7B-Instruct",
		},
		{
			description: "Text generation model used to write code.",
			id: "Qwen/Qwen2.5-Coder-32B-Instruct",
		},
	],
	spaces: [
		{
			description: "A leaderboard to compare different open-source text generation models based on various benchmarks.",
			id: "open-llm-leaderboard/open_llm_leaderboard",
		},
		{
			description: "A leaderboard for comparing chain-of-thought performance of models.",
			id: "logikon/open_cot_leaderboard",
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
			description: "A leaderboard that ranks text generation models based on blind votes from people.",
			id: "lmsys/chatbot-arena-leaderboard",
		},
		{
			description: "An chatbot to converse with a very powerful text generation model.",
			id: "mlabonne/phixtral-chat",
		},
	],
	summary:
		"Generating text is the task of generating new text given another text. These models can, for example, fill in incomplete text or paraphrase.",
	widgetModels: ["mistralai/Mistral-Nemo-Instruct-2407"],
	youtubeId: "e9gNEAlsOvU",
};

export default taskData;
