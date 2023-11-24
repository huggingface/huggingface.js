import type { TaskDataCustom } from "..";

const taskData: TaskDataCustom = {
	datasets: [
		{
			description: "A widely used dataset used to benchmark multiple variants of text classification.",
			id: "glue",
		},
		{
			description: "A text classification dataset used to benchmark natural language inference models",
			id: "snli",
		},
	],
	demo: {
		inputs: [
			{
				label: "Input",
				content: "I love Hugging Face!",
				type: "text",
			},
		],
		outputs: [
			{
				type: "chart",
				data: [
					{
						label: "POSITIVE",
						score: 0.9,
					},
					{
						label: "NEUTRAL",
						score: 0.1,
					},
					{
						label: "NEGATIVE",
						score: 0.0,
					},
				],
			},
		],
	},
	metrics: [
		{
			description: "",
			id: "accuracy",
		},
		{
			description: "",
			id: "recall",
		},
		{
			description: "",
			id: "precision",
		},
		{
			description:
				"The F1 metric is the harmonic mean of the precision and recall. It can be calculated as: F1 = 2 * (precision * recall) / (precision + recall)",
			id: "f1",
		},
	],
	models: [
		{
			description: "A robust model trained for sentiment analysis.",
			id: "distilbert-base-uncased-finetuned-sst-2-english",
		},
		{
			description: "Multi-genre natural language inference model.",
			id: "roberta-large-mnli",
		},
	],
	spaces: [
		{
			description: "An application that can classify financial sentiment.",
			id: "IoannisTr/Tech_Stocks_Trading_Assistant",
		},
		{
			description: "A dashboard that contains various text classification tasks.",
			id: "miesnerjacob/Multi-task-NLP",
		},
		{
			description: "An application that analyzes user reviews in healthcare.",
			id: "spacy/healthsea-demo",
		},
	],
	summary:
		"Text Classification is the task of assigning a label or class to a given text. Some use cases are sentiment analysis, natural language inference, and assessing grammatical correctness.",
	widgetModels: ["distilbert-base-uncased-finetuned-sst-2-english"],
	youtubeId: "leNG9fN9FQU",
};

export default taskData;
