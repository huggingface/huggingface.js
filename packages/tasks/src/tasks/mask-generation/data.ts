import type { TaskDataCustom } from "..";

const taskData: TaskDataCustom = {
	datasets: [
		{
			description: "Widely used benchmark dataset for multiple Vision tasks.",
			id: "merve/coco2017",
		},
        {
            description: "Medical Imaging dataset of the Human Brain for segmentation and mask generating tasks",
            id: "rocky93/BraTS_segmentation"
        }
	],
	demo: {
		inputs: [],
		outputs: [],
	},
	metrics: [
		{
			description:
				"IoU is used to measure the overlap between predicted mask and the ground truth mask.",
			id: "Intersection over Union (IoU)",
		}
	],
	models: [],
	spaces: [],
	summary:"Mask generation task involves generating masks for meaningful segments in a given image. It could be zero-shot or based on training data.",
    widgetModels: [],
    youtubeId: "",
};

export default taskData;