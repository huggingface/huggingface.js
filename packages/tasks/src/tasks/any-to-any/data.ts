import type { TaskDataCustom } from "..";

const taskData: TaskDataCustom = {
	datasets: [
		{
			description: "All-Modality Alignment Dataset with Fine-grained Preference Annotations and Language Feedback.",
			id: "PKU-Alignment/align-anything-400k",
		},
	],
	demo: {
		inputs: [],
		outputs: [],
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
