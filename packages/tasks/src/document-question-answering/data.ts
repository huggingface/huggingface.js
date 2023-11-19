import type { TaskDataCustom } from "../Types";

const taskData: TaskDataCustom = {
	datasets: [
		{
			// TODO write proper description
			description:
				"Dataset from the 2020 DocVQA challenge. The documents are taken from the UCSF Industry Documents Library.",
			id: "eliolio/docvqa",
		},
	],
	demo: {
		inputs: [
			{
				label: "Question",
				content: "What is the idea behind the consumer relations efficiency team?",
				type: "text",
			},
			{
				filename: "document-question-answering-input.png",
				type: "img",
			},
		],
		outputs: [
			{
				label: "Answer",
				content: "Balance cost efficiency with quality customer service",
				type: "text",
			},
		],
	},
	metrics: [
		{
			description:
				"The evaluation metric for the DocVQA challenge is the Average Normalized Levenshtein Similarity (ANLS). This metric is flexible to character regognition errors and compares the predicted answer with the ground truth answer.",
			id: "anls",
		},
		{
			description:
				"Exact Match is a metric based on the strict character match of the predicted answer and the right answer. For answers predicted correctly, the Exact Match will be 1. Even if only one character is different, Exact Match will be 0",
			id: "exact-match",
		},
	],
	models: [
		{
			description: "A LayoutLM model for the document QA task, fine-tuned on DocVQA and SQuAD2.0.",
			id: "impira/layoutlm-document-qa",
		},
		{
			description: "A special model for OCR-free Document QA task. Donut model fine-tuned on DocVQA.",
			id: "naver-clova-ix/donut-base-finetuned-docvqa",
		},
	],
	spaces: [
		{
			description: "A robust document question answering application.",
			id: "impira/docquery",
		},
		{
			description: "An application that can answer questions from invoices.",
			id: "impira/invoices",
		},
	],
	summary:
		"Document Question Answering (also known as Document Visual Question Answering) is the task of answering questions on document images. Document question answering models take a (document, question) pair as input and return an answer in natural language. Models usually rely on multi-modal features, combining text, position of words (bounding-boxes) and image.",
	widgetModels: ["impira/layoutlm-document-qa"],
	youtubeId: "",
};

export default taskData;
