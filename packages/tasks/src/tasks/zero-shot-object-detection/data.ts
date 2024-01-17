import type { TaskDataCustom } from "..";

const taskData: TaskDataCustom = {
	datasets: [
		{
			description: "ImageNet (ILSVRC) 2012 is a widely used dataset of approximately 13 million labeled images organized by the WordNet hierarchy. It provides 1,281,167 training images, 50,000 validation images, and 100,000 test images across 1000 object classes."
			id: "imagenet-1k"
		}, 
		{
			description: "Microsoft COCO, a large-scale dataset of object instance segmentation, aims to advance object recognition by placing it in the context of scene understanding. It comprises 328k images with 2.5 million labeled instances of 91 common objects easily recognizable by a 4-year-old. ",
			id: "merve/coco2017",
		}
	],
	demo: {
		inputs: [
			{
				filename: "zero-sh-obj-detection_1.png"
				type: "img",
			},
			{	label: "Classes",
				content: "human face, rocket, nasa badge, star-spangled banner",
				type: "text", 
			},
		],
		outputs: [
			{
				filename: "zero-sh-obj-detection_2.png"
				type: "img",
			}, 
			{ 
				type: "chart", 
				data: [
					{
						label: "human face", 
						score: 0.3571370542049408,
					},
					{
						label: "nasa badge", 
						score: 0.28099656105041504,
					},
					{
						label: "rocket", 
						score: 0.2110239565372467,
					},
					{
						label: "star-spangled banner", 
						score: 0.13790413737297058,
					},
					{
						label: "nasa badge", 
						score: 0.11950037628412247,
					},
					{
						label: "rocket", 
						score: 0.10649408400058746,
					},
				]
			}
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
			description: "OWL-ViT is a zero-shot text-conditioned object detection model that uses CLIP as its multi-modal backbone to detect objects in images based on textual descriptions. It can handle multiple text queries per image and has been trained on standard detection datasets using a bipartite matching loss."
			id: "google/owlvit-base-patch32"
		}, 
		{
			description: "CLIP is a model developed by OpenAI to study the robustness of computer vision models and their ability to generalize to unseen image classification tasks. It's not intended for direct deployment but requires careful evaluation in specific contexts."
			id: "openai/clip-vit-base-patch32"

		},
	],	
	spaces: [],
	summary: "Zero shot object detection is the task of detecting objects in previously unseen images based on free-text queries.",
	widgetModels: ["google/owlvit-base-patch32"],
	youtubeId: undefined,
};

export default taskData;
