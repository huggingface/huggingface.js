import type { TaskDataCustom } from "..";

const taskData: TaskDataCustom = {
	datasets: [],
	demo: {
		inputs: [],
		outputs: [],
	},
	metrics: [],
	models: [
		{
			description: "Small yet powerful mask generation model.",
			id: "Zigeng/SlimSAM-uniform-50",
		},
		{
			description: "Very strong mask generation model.",
			id: "facebook/sam-vit-huge",
		},
	],
	spaces: [
		{
			description: "An application that combines a mask generation model with an image embedding model for open-vocabulary image segmentation.",
			id: "SkalskiP/SAM_and_MetaCLIP",
		},
		{
			description: "An application that compares the performance of a large and a small mask generation model.",
			id: "merve/slimsam",
		},
		{
			description: "An application based on an improved mask generation model.",
			id: "linfanluntan/Grounded-SAM",
		},
		{
			description: "An application to remove objects from videos using mask generation models.",
			id: "SkalskiP/SAM_and_ProPainter",
		},
	],
	summary:
		"Mask generation is the task of generating masks that identifies a specific object or region of interest in a given image. Masks are often used in segmentation tasks, where they provide a precise way to isolate the object of interest for further processing or analysis.",
	widgetModels: [],
	youtubeId: "",
};

export default taskData;
