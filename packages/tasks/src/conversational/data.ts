import type { TaskDataCustom } from "../Types";

const taskData: TaskDataCustom = {
	datasets: [
		{
			description:
				"A dataset of 7k conversations explicitly designed to exhibit multiple conversation modes: displaying personality, having empathy, and demonstrating knowledge.",
			id: "blended_skill_talk",
		},
		{
			description:
				"ConvAI is a dataset of human-to-bot conversations labeled for quality. This data can be used to train a metric for evaluating dialogue systems",
			id: "conv_ai_2",
		},
		{
			description: "EmpatheticDialogues, is a dataset of 25k conversations grounded in emotional situations",
			id: "empathetic_dialogues",
		},
	],
	demo: {
		inputs: [
			{
				label: "Input",
				content: "Hey my name is Julien! How are you?",
				type: "text",
			},
		],
		outputs: [
			{
				label: "Answer",
				content: "Hi Julien! My name is Julia! I am well.",
				type: "text",
			},
		],
	},
	metrics: [
		{
			description:
				"BLEU score is calculated by counting the number of shared single or subsequent tokens between the generated sequence and the reference. Subsequent n tokens are called “n-grams”. Unigram refers to a single token while bi-gram refers to token pairs and n-grams refer to n subsequent tokens. The score ranges from 0 to 1, where 1 means the translation perfectly matched and 0 did not match at all",
			id: "bleu",
		},
	],
	models: [
		{
			description: "A faster and smaller model than the famous BERT model.",
			id: "facebook/blenderbot-400M-distill",
		},
		{
			description:
				"DialoGPT is a large-scale pretrained dialogue response generation model for multiturn conversations.",
			id: "microsoft/DialoGPT-large",
		},
	],
	spaces: [
		{
			description: "A chatbot based on Blender model.",
			id: "EXFINITE/BlenderBot-UI",
		},
	],
	summary:
		"Conversational response modelling is the task of generating conversational text that is relevant, coherent and knowledgable given a prompt. These models have applications in chatbots, and as a part of voice assistants",
	widgetModels: ["facebook/blenderbot-400M-distill"],
	youtubeId: "",
};

export default taskData;
