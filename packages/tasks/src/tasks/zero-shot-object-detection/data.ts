import type { TaskDataCustom } from "..";

const taskData: TaskDataCustom = {
	datasets: [],
	demo: {
		inputs: [
			{
				filename: "zero-shot-object-detection-input.jpg",
				type: "img",
			},
			{
				label: "Classes",
				content: "cat, dog, bird",
				type: "text",
			},
		],
		outputs: [
			{
				filename: "zero-shot-object-detection-output.jpg",
				type: "img",
			},
		],
	},
	metrics: [
		{
			description:
				"The Average Precision (AP) metric is the Area Under the PR Curve (AUC-PR). It is calculated for each class separately",
			id: "Average Precision",
		},
		{
			description: "The Mean Average Precision (mAP) metric is the overall average of the AP values",
			id: "Mean Average Precision",
		},
		{
			description:
				"The APα metric is the Average Precision at the IoU threshold of a α value, for example, AP50 and AP75",
			id: "APα",
		},
	],
	models: [
		{
			description: "Solid zero-shot object detection model that uses CLIP as backbone.",
			id: "google/owlvit-base-patch32",
		},
		{
			description: "The improved version of the owlvit model.",
			id: "google/owlv2-base-patch16-ensemble",
		},
	],
	spaces: [
		{
			description: "A demo to try the state-of-the-art zero-shot object detection model, OWLv2.",
			id: "merve/owlv2",
		},
	],
	summary:
		"Zero-shot object detection is a computer vision task to detect objects and their classes in images, without any prior training or knowledge of the classes. Zero-shot object detection models receive an image as input, as well as a list of candidate classes, and output the bounding boxes and labels where the objects have been detected.",
	widgetModels: [],
	youtubeId: "",
};

export default taskData;
