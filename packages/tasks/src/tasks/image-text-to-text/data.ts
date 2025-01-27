import type { TaskDataCustom } from "../index.js";

const taskData: TaskDataCustom = {
	datasets: [
		{
			description: "Instructions composed of image and text.",
			id: "liuhaotian/LLaVA-Instruct-150K",
		},
		{
			description: "Collection of image-text pairs on scientific topics.",
			id: "DAMO-NLP-SG/multimodal_textbook",
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
			description: "Small and efficient yet powerful vision language model.",
			id: "HuggingFaceTB/SmolVLM-Instruct",
		},
		{
			description: "A screenshot understanding model used to control computers.",
			id: "showlab/ShowUI-2B",
		},
		{
			description: "Cutting-edge vision language model.",
			id: "allenai/Molmo-7B-D-0924",
		},
		{
			description: "Small yet powerful model.",
			id: "vikhyatk/moondream2",
		},
		{
			description: "Strong image-text-to-text model.",
			id: "Qwen/Qwen2-VL-7B-Instruct",
		},
		{
			description: "Image-text-to-text model with reasoning capabilities.",
			id: "Qwen/QVQ-72B-Preview",
		},
		{
			description: "Strong image-text-to-text model focused on documents.",
			id: "stepfun-ai/GOT-OCR2_0",
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
			id: "akhaliq/Molmo-7B-D-0924",
		},
		{
			description: "An image-text-to-text application focused on documents.",
			id: "stepfun-ai/GOT_official_online_demo",
		},
		{
			description: "An application for chatting with an image-text-to-text model.",
			id: "GanymedeNil/Qwen2-VL-7B",
		},
		{
			description: "An application that parses screenshots into actions.",
			id: "showlab/ShowUI",
		},
		{
			description: "An application that detects gaze.",
			id: "smoondream/gaze-demo",
		},
	],
	summary:
		"Image-text-to-text models take in an image and text prompt and output text. These models are also called vision-language models, or VLMs. The difference from image-to-text models is that these models take an additional text input, not restricting the model to certain use cases like image captioning, and may also be trained to accept a conversation as input.",
	widgetModels: ["meta-llama/Llama-3.2-11B-Vision-Instruct"],
	youtubeId: "IoGaGfU1CIg",
};

export default taskData;
