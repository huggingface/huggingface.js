import type { TaskDataCustom } from "..";

const taskData: TaskDataCustom = {
	datasets: [
		{
			description: "Instructions composed of image and text.",
			id: "liuhaotian/LLaVA-Instruct-150K",
		},
		{
			description: "Conversation turns where questions involve image and text.",
			id: "liuhaotian/LLaVA-Pretrain",
		},
		{
			description: "A collection of datasets made for model fine-tuning.",
			id: "HuggingFaceM4/the_cauldron",
		},
		{
			description: "Screenshots of websites with their HTML/CSS codes.",
			id: "HuggingFaceM4/WebSight",
		},
	],
	demo: {
		inputs: [
			{
				filename: "image-text-to-text-input.png",
				type: "img",
			},
			{
				label: "Text Prompt",
				content: "Describe the position of the bee in detail.",
				type: "text",
			},
		],
		outputs: [
			{
				label: "Answer",
				content:
					"The bee is sitting on a pink flower, surrounded by other flowers. The bee is positioned in the center of the flower, with its head and front legs sticking out.",
				type: "text",
			},
		],
	},
	metrics: [],
	models: [
		{
			description: "Cutting-edge vision language model that can take multiple image inputs.",
			id: "facebook/chameleon-7b",
		},
		{
			description: "Cutting-edge conversational vision language model that can take multiple image inputs.",
			id: "HuggingFaceM4/idefics2-8b-chatty",
		},
		{
			description: "Small yet powerful model.",
			id: "vikhyatk/moondream2",
		},
		{
			description: "Strong image-text-to-text model made to understand documents.",
			id: "mPLUG/DocOwl1.5",
		},
		{
			description: "Strong image-text-to-text model.",
			id: "llava-hf/llava-v1.6-mistral-7b-hf",
		},
	],
	spaces: [
		{
			description: "Leaderboard to evaluate vision language models.",
			id: "opencompass/open_vlm_leaderboard",
		},
		{
			description: "Vision language models arena, where models are ranked by votes of users.",
			id: "WildVision/vision-arena",
		},
		{
			description: "Powerful vision-language model assistant.",
			id: "liuhaotian/LLaVA-1.6",
		},
		{
			description: "An application to compare outputs of different vision language models.",
			id: "merve/compare_VLMs",
		},
		{
			description: "An application for document vision language tasks.",
			id: "mPLUG/DocOwl",
		},
	],
	summary:
		"Image-text-to-text models take in an image and text prompt and output text. These models are also called vision-language models, or VLMs. The difference from image-to-text models is that these models take an additional text input, not restricting the model to certain use cases like image captioning, and may also be trained to accept a conversation as input.",
	widgetModels: ["microsoft/kosmos-2-patch14-224"],
	youtubeId: "IoGaGfU1CIg",
};

export default taskData;
