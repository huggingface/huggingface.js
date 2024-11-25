import type { TaskDataCustom } from "../index.js";

const taskData: TaskDataCustom = {
	datasets: [
		{
			description: "All-modality alignment dataset with fine-grained preference annotations and language feedback.",
			id: "PKU-Alignment/align-anything-400k",
		},
	],
	demo: {
		inputs: [
			{
				filename: "distractedboyfriendmeme.jpeg",
				type: "img",
			},
			{
				label: "Text Prompt",
				content: "What is the colour of the shirt the man is wearing?",
				type: "text",
			},
		],
		outputs: [
			{
				label: "Answer",
				content: "The man is wearing a blue and white plaid shirt.",
				type: "text",
			},
		],
	},
	metrics: [],
	models: [
		{
			description: "A next token prediction model.",
			id: "BAAI/Emu3-Gen",
		},
		{
			description:
				"Janus is a versatile multimodal framework that decouples visual encoding for superior understanding and generation across tasks.",
			id: "deepseek-ai/Janus-1.3B",
		},
	],
	spaces: [
		{
			description:
				"Janus is a versatile multimodal framework that decouples visual encoding for superior understanding and generation across tasks.",
			id: "deepseek-ai/Janus-1.3B",
		},
	],
	summary:
		"Any-to-Any is the task for models that can take any combination of input and output types, to such as text, image, and video.",
	widgetModels: [],
	youtubeId: "",
};

export default taskData;
