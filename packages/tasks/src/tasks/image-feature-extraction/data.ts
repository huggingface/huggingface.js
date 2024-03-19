import type { TaskDataCustom } from "..";

const taskData: TaskDataCustom = {
	datasets: [
		{
			description:
				"ImageNet-1K is a image classification dataset in which images are used to train image-feature-extraction models.",
			id: "imagenet-1k",
		},
	],
	demo: {
		inputs: [
			{
				filename: "mask-generation-input.png",
				type: "img",
			},
		],
		outputs: [
			{
				table: [
					["Dimension 1", "Dimension 2", "Dimension 3"],
					["0.21236686408519745", "1.0919708013534546", "0.8512550592422485"],
					["0.809657871723175", "-0.18544459342956543", "-0.7851548194885254"],
					["1.3103108406066895", "-0.2479034662246704", "-0.9107287526130676"],
					["1.8536205291748047", "-0.36419737339019775", "0.09717650711536407"],
				],
				type: "tabular",
			},
		],
	},
	metrics: [],
	models: [
		{
			description: "A powerful image feature extraction model.",
			id: "timm/vit_large_patch14_dinov2.lvd142m",
		},
		{
			description: "A strong image feature extraction model.",
			id: "google/vit-base-patch16-224-in21k",
		},
        {
			description: "A robust image feature extraction models.",
			id: "facebook/dino-vitb16",
		},
	],
	spaces: [],
	summary:
		"Image feature extraction is the task of extracting features learnt in a computer vision model.",
	widgetModels: [],
};

export default taskData;
