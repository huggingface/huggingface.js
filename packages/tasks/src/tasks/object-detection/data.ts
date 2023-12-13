import type { TaskDataCustom } from "..";

const taskData: TaskDataCustom = {
	datasets: [
		{
			// TODO write proper description
			description: "Widely used benchmark dataset for multiple Vision tasks.",
			id: "merve/coco2017",
		},
	],
	demo: {
		inputs: [
			{
				filename: "object-detection-input.jpg",
				type: "img",
			},
		],
		outputs: [
			{
				filename: "object-detection-output.jpg",
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
			description: "Solid object detection model trained on the benchmark dataset COCO 2017.",
			id: "facebook/detr-resnet-50",
		},
		{
			description: "Strong object detection model trained on ImageNet-21k dataset.",
			id: "microsoft/beit-base-patch16-224-pt22k-ft22k",
		},
	],
	spaces: [
		{
			description: "Leaderboard to compare various object detection models across several metrics.",
			id: "hf-vision/object_detection_leaderboard",
		},
		{
			description: "An object detection application that can detect unseen objects out of the box.",
			id: "merve/owlv2",
		},
		{
			description: "An application that contains various object detection models to try from.",
			id: "Gradio-Blocks/Object-Detection-With-DETR-and-YOLOS",
		},
		{
			description: "An application that shows multiple cutting edge techniques for object detection and tracking.",
			id: "kadirnar/torchyolo",
		},
		{
			description: "An object tracking, segmentation and inpainting application.",
			id: "VIPLab/Track-Anything",
		},
	],
	summary:
		"Object Detection models allow users to identify objects of certain defined classes. Object detection models receive an image as input and output the images with bounding boxes and labels on detected objects.",
	widgetModels: ["facebook/detr-resnet-50"],
	youtubeId: "WdAeKSOpxhw",
};

export default taskData;
